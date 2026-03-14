import { createClient } from "@/lib/supabase/server"
import { LandingContent } from "@/components/landing-content"
import { getUserQuota } from "@/lib/quota"
import type { Profile, QuotaInfo } from "@/types/database"

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Profile | null = null
  let quota: QuotaInfo | null = null

  if (user) {
    // Fetch user profile and quota in parallel
    const [profileResult, quotaResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      getUserQuota(supabase, user.id),
    ])
    
    profile = profileResult.data
    quota = quotaResult
  }

  return <LandingContent user={user} profile={profile} initialQuota={quota} />
}
