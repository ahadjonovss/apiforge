import { z } from 'zod'

export const emailSchema = z.email("Email manzil noto'g'ri")

export const passwordSchema = z
  .string()
  .min(8, "Parol kamida 8 belgidan iborat bo'lishi kerak")
  .regex(/[a-z]/i, 'Parolda kamida bitta harf bo‘lishi kerak')
  .regex(/\d/, 'Parolda kamida bitta raqam bo‘lishi kerak')

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'Ism kamida 2 belgidan iborat bo‘lishi kerak')
  .max(60, 'Ism 60 belgidan oshmasligi kerak')

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Parol kiritilmagan'),
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
    message: 'Parollar mos kelmadi',
  })

export const profileSchema = z.object({
  displayName: displayNameSchema,
  photoUrl: z.union([z.url('Havola noto‘g‘ri'), z.literal('')]),
})

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Joriy parol kiritilmagan'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Parollar mos kelmadi',
  })

export const passwordResetSchema = z.object({ email: emailSchema })

export type SignInValues = z.infer<typeof signInSchema>
export type SignUpValues = z.infer<typeof signUpSchema>
export type ProfileValues = z.infer<typeof profileSchema>
export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>
export type PasswordResetValues = z.infer<typeof passwordResetSchema>
