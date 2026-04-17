import type { QuotaInfo } from "@/types/database"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Get user's current quota information
 * Uses database function that handles CET timezone reset
 */
export async function getUserQuota(
  supabase: SupabaseClient,
  userId: string
): Promise<QuotaInfo | null> {
  const { data, error } = await supabase.rpc("get_or_create_quota", {
    p_user_id: userId,
  })

  if (error || !data || data.length === 0) {
    console.error("Error fetching quota:", error)
    return null
  }

  const quota = data[0]
  // SQL function returns out_validations_today and out_daily_limit
  const validationsToday = quota.out_validations_today ?? quota.validations_today ?? 0
  const dailyLimit = quota.out_daily_limit ?? quota.daily_limit ?? 5
  return {
    validations_today: validationsToday,
    daily_limit: dailyLimit,
    remaining: dailyLimit - validationsToday,
  }
}

/**
 * Increment user validation count and check if quota exceeded
 * Returns updated quota info and whether the limit was exceeded
 */
export async function incrementUserValidation(
  supabase: SupabaseClient,
  userId: string
): Promise<{ quota: QuotaInfo; exceeded: boolean } | null> {
  const { data, error } = await supabase.rpc("increment_user_validation", {
    p_user_id: userId,
  })

  if (error || !data || data.length === 0) {
    console.error("Error incrementing validation:", error)
    return null
  }

  const result = data[0]
  // SQL function returns out_validations_today, out_daily_limit, out_quota_exceeded
  const validationsToday = result.out_validations_today ?? result.validations_today ?? 0
  const dailyLimit = result.out_daily_limit ?? result.daily_limit ?? 5
  const quotaExceeded = result.out_quota_exceeded ?? result.quota_exceeded ?? false
  return {
    quota: {
      validations_today: validationsToday,
      daily_limit: dailyLimit,
      remaining: Math.max(0, dailyLimit - validationsToday),
    },
    exceeded: quotaExceeded,
  }
}

/**
 * Check if user has remaining quota without incrementing
 */
export async function hasRemainingQuota(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const quota = await getUserQuota(supabase, userId)
  if (!quota) return false
  return quota.remaining > 0
}

/**
 * Get current CET date string
 */
export function getCurrentCETDate(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Europe/Paris",
  })
}
