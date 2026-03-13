import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createKeySchema } from "@/lib/schemas"
import { generateApiKey, generateSecret, hashSecret } from "@/lib/crypto"

// GET /api/v1/keys - List user's API keys
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key, usage_count, max_usage, is_active, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// POST /api/v1/keys - Create a new API key
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const result = createKeySchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const key = generateApiKey()
  const secret = generateSecret()
  const secretHash = hashSecret(secret)

  const { error } = await supabase.from("api_keys").insert({
    user_id: user.id,
    name: result.data.name,
    key,
    secret_hash: secretHash,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Return the secret in plaintext - this is the only time it's shown
  return NextResponse.json({ key, secret }, { status: 201 })
}
