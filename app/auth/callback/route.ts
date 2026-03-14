import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const pendingValidation = searchParams.get("pendingValidation")

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // If there's a pending validation, redirect to landing page with flag
      if (pendingValidation === "true") {
        return NextResponse.redirect(`${origin}/?pendingValidation=true`)
      }
      // Otherwise go to dashboard as before
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
