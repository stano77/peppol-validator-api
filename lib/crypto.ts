import { randomUUID, randomBytes, createHash } from 'crypto'

export function generateApiKey(): string {
  return `pv_${randomUUID().replace(/-/g, '')}`
}

export function generateSecret(): string {
  return `pvs_${randomBytes(32).toString('base64url')}`
}

export function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex')
}
