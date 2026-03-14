import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateApiKey, generateSecret, hashSecret } from "@/lib/crypto"

// GET /api/v1/keys - Get user's active API key
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: apiKey, error } = await supabase
    .from("api_keys")
    .select("id, name, key, usage_count, max_usage, is_active, created_at")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single()

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ apiKey: apiKey || null })
}

// POST /api/v1/keys - Create or regenerate API key (single key per user)
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()

  // Deactivate any existing keys for this user
  await admin
    .from("api_keys")
    .update({ is_active: false })
    .eq("user_id", user.id)

  const key = generateApiKey()
  const secret = generateSecret()
  const secretHash = hashSecret(secret)

  const { data: newKey, error } = await admin
    .from("api_keys")
    .insert({
      user_id: user.id,
      name: "API Key",
      key,
      secret_hash: secretHash,
      max_usage: 50,
      usage_count: 0,
      is_active: true,
    })
    .select("id, name, key, usage_count, max_usage, is_active, created_at")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Return key AND secret - secret is only shown once
  return NextResponse.json({ 
    apiKey: newKey, 
    secret,
    message: "Save your API secret now. It won't be shown again."
  }, { status: 201 })
}

// DELETE /api/v1/keys - Revoke API key
export async function DELETE() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { error } = await supabase
    .from("api_keys")
    .update({ is_active: false })
    .eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
