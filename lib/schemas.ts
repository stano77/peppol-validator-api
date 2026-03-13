import { z } from 'zod'

export const createKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
})

export type CreateKeyInput = z.infer<typeof createKeySchema>
