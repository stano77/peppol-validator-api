import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUserQuota, incrementUserValidation } from "@/lib/quota"
import { isRateLimited } from "@/lib/rate-limit"

const VALIDATOR_URL = process.env.PEPPOL_VALIDATOR_URL!
const VALIDATOR_TIMEOUT_MS = 30_000
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: Request) {
  // Verify user session
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    )
  }

  // Rate limit by user ID
  if (isRateLimited(user.id)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Max 10 requests per minute." },
      { status: 429 }
    )
  }

  // Check current quota before validation
  const quota = await getUserQuota(supabase, user.id)
  if (!quota) {
    return NextResponse.json(
      { error: "Unable to fetch quota" },
      { status: 500 }
    )
  }

  if (quota.remaining <= 0) {
    return NextResponse.json(
      {
        error: "Daily quota exceeded. Resets at midnight CET.",
        quota: {
          used: quota.validations_today,
          limit: quota.daily_limit,
          remaining: 0,
        },
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

  // Check file size
  if (xmlBody.length > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File size exceeds 5MB limit" },
      { status: 400 }
    )
  }

  // Basic XML validation
  if (!xmlBody.trim().startsWith("<?xml") && !xmlBody.trim().startsWith("<")) {
    return NextResponse.json(
      { error: "Invalid XML format" },
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
    console.log("[v0] Upstream validation response:", JSON.stringify(upstreamResult, null, 2))
  } catch {
    const responseTimeMs = Date.now() - startTime

    // Log the failed validation
    const admin = createAdminClient()
    await admin.from("validation_logs").insert({
      user_id: user.id,
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

  // Increment quota and log - run in parallel
  const admin = createAdminClient()
  const [quotaResult] = await Promise.all([
    incrementUserValidation(admin, user.id),
    admin.from("validation_logs").insert({
      user_id: user.id,
      status: logStatus,
      response_time_ms: responseTimeMs,
    }),
  ])

  // Return validation result with updated quota
  return NextResponse.json(
    {
      ...upstreamResult,
      quota: quotaResult
        ? {
            used: quotaResult.quota.validations_today,
            limit: quotaResult.quota.daily_limit,
            remaining: quotaResult.quota.remaining,
          }
        : undefined,
    },
    { status: upstreamStatus }
  )
}
