import { z } from 'zod'

export const workspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'validation.titleMin')
    .max(60, 'validation.titleMax'),
  description: z.string().trim().max(200, 'validation.descMax'),
})

export const teamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'validation.titleMin')
    .max(60, 'validation.titleMax'),
  description: z.string().trim().max(200, 'validation.descMax'),
})

export const memberSchema = z.object({
  email: z.email('validation.emailInvalid'),
  role: z.enum(['admin', 'member']),
})

export type WorkspaceValues = z.infer<typeof workspaceSchema>
export type TeamValues = z.infer<typeof teamSchema>
export type MemberValues = z.infer<typeof memberSchema>
