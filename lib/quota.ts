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
  return {
    validations_today: quota.validations_today,
    daily_limit: quota.daily_limit,
    remaining: quota.daily_limit - quota.validations_today,
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
  return {
    quota: {
      validations_today: result.validations_today,
      daily_limit: result.daily_limit,
      remaining: Math.max(0, result.daily_limit - result.validations_today),
    },
    exceeded: result.quota_exceeded,
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
