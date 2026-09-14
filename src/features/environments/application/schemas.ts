import { z } from 'zod'

export const environmentSchema = z.object({
  name: z.string().trim().min(1, 'environment.error.nameRequired').max(60, 'environment.error.nameLong'),
})
