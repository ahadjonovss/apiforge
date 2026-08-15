import { z } from 'zod'

export const workspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nom kamida 2 belgidan iborat bo‘lishi kerak')
    .max(60, 'Nom 60 belgidan oshmasligi kerak'),
  description: z.string().trim().max(200, 'Tavsif 200 belgidan oshmasligi kerak'),
})

export const teamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nom kamida 2 belgidan iborat bo‘lishi kerak')
    .max(60, 'Nom 60 belgidan oshmasligi kerak'),
  description: z.string().trim().max(200, 'Tavsif 200 belgidan oshmasligi kerak'),
})

export const memberSchema = z.object({
  email: z.email("Email manzil noto'g'ri"),
  role: z.enum(['admin', 'member']),
})

export type WorkspaceValues = z.infer<typeof workspaceSchema>
export type TeamValues = z.infer<typeof teamSchema>
export type MemberValues = z.infer<typeof memberSchema>
