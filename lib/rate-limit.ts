const windowMs = 60_000 // 1 minute
const maxRequests = 10  // per key per window

const store = new Map<string, number[]>()

export function isRateLimited(apiKey: string): boolean {
  const now = Date.now()
  const timestamps = store.get(apiKey) ?? []

  // Remove expired timestamps
  const valid = timestamps.filter((t) => now - t < windowMs)
  valid.push(now)
  store.set(apiKey, valid)

  return valid.length > maxRequests
}
