import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserQuota } from "@/lib/quota"

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    )
  }

  const quota = await getUserQuota(supabase, user.id)
  
  if (!quota) {
    return NextResponse.json(
      { error: "Unable to fetch quota" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    used: quota.validations_today,
    limit: quota.daily_limit,
    remaining: quota.remaining,
  })
}
