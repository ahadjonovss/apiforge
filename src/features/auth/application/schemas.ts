import { z } from 'zod'

export const emailSchema = z.email('validation.emailInvalid')

export const passwordSchema = z
  .string()
  .min(8, 'validation.passwordMin')
  .regex(/[a-z]/i, 'validation.passwordLetter')
  .regex(/\d/, 'validation.passwordDigit')

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'validation.nameMin')
  .max(60, 'validation.nameMax')

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'validation.passwordEmpty'),
})

export const signUpSchema = z
  .object({
    displayName: displayNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'validation.passwordMismatch',
  })

export const profileSchema = z.object({
  displayName: displayNameSchema,
  photoUrl: z.union([z.url('validation.urlInvalid'), z.literal('')]),
})

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'validation.currentPasswordEmpty'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'validation.passwordMismatch',
  })

export const passwordResetSchema = z.object({ email: emailSchema })

export type SignInValues = z.infer<typeof signInSchema>
export type SignUpValues = z.infer<typeof signUpSchema>
export type ProfileValues = z.infer<typeof profileSchema>
export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>
export type PasswordResetValues = z.infer<typeof passwordResetSchema>
