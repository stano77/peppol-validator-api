import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { hashSecret } from "@/lib/crypto"
import { isRateLimited } from "@/lib/rate-limit"

const VALIDATOR_URL = process.env.PEPPOL_VALIDATOR_URL!
const VALIDATOR_TIMEOUT_MS = 30_000

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key")
  const apiSecret = request.headers.get("x-api-secret")

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Missing X-API-Key or X-API-Secret header" },
      { status: 401 }
    )
  }

  // Rate limit
  if (isRateLimited(apiKey)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Max 10 requests per minute." },
      { status: 429 }
    )
  }

  // Look up key (service-role client bypasses RLS)
  const admin = createAdminClient()
  const { data: keyRecord, error: lookupError } = await admin
    .from("api_keys")
    .select("*")
    .eq("key", apiKey)
    .eq("is_active", true)
    .single()

  if (lookupError || !keyRecord) {
    return NextResponse.json(
      { error: "Invalid API key" },
      { status: 401 }
    )
  }

  // Verify secret
  const providedHash = hashSecret(apiSecret)
  if (providedHash !== keyRecord.secret_hash) {
    return NextResponse.json(
      { error: "Invalid API secret" },
      { status: 401 }
    )
  }

  // Check quota
  if (keyRecord.usage_count >= keyRecord.max_usage) {
    return NextResponse.json(
      {
        error: "Free quota exceeded. Upgrade to continue.",
        usage: keyRecord.usage_count,
        limit: keyRecord.max_usage,
      },
      { status: 403 }
    )
  }

  // Read XML body
  const xmlBody = await request.text()
  if (!xmlBody.trim()) {
    return NextResponse.json(
      { error: "Request body must contain UBL XML" },
      { status: 400 }
    )
  }

  // Proxy to upstream validator
  const startTime = Date.now()
  let upstreamResult: Record<string, unknown>
  let upstreamStatus: number

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), VALIDATOR_TIMEOUT_MS)

    const upstreamRes = await fetch(VALIDATOR_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/xml",
        "CF-Access-Client-Id": process.env.CF_VALIDATOR_ACCESS_CLIENT_ID!,
        "CF-Access-Client-Secret": process.env.CF_VALIDATOR_ACCESS_CLIENT_SECRET!,
      },
      body: xmlBody,
      signal: controller.signal,
    })

    clearTimeout(timeout)
    upstreamStatus = upstreamRes.status
    upstreamResult = await upstreamRes.json()
  } catch (err) {
    const responseTimeMs = Date.now() - startTime

    // Log the failed validation
    await admin.from("validation_logs").insert({
      api_key_id: keyRecord.id,
      status: "error",
      response_time_ms: responseTimeMs,
    })

    return NextResponse.json(
      { error: "Upstream validation service unavailable" },
      { status: 502 }
    )
  }

  const responseTimeMs = Date.now() - startTime

  // Determine status for logging
  const logStatus = upstreamStatus === 200
    ? (upstreamResult.error_count === 0 ? "valid" : "invalid")
    : "error"

  // Increment usage (atomic) and log - run in parallel
  await Promise.all([
    admin.rpc("increment_usage", { key_id: keyRecord.id }),
    admin.from("validation_logs").insert({
      api_key_id: keyRecord.id,
      status: logStatus,
      response_time_ms: responseTimeMs,
    }),
  ])

  return NextResponse.json(upstreamResult, { status: upstreamStatus })
}
