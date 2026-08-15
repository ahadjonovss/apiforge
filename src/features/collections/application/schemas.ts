import { z } from 'zod'

export const collectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'validation.titleMin')
    .max(60, 'validation.titleMax'),
  description: z.string().trim().max(200, 'validation.descMax'),
})

export const baseUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || value.includes('{{') || /^[a-z][a-z0-9+.-]*:\/\/.+/i.test(value),
    { message: 'validation.baseUrlInvalid' },
  )

export const collectionSettingsSchema = z.object({
  name: collectionSchema.shape.name,
  description: collectionSchema.shape.description,
  baseUrl: baseUrlSchema,
})

export const endpointSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'validation.titleEmpty')
    .max(80, 'validation.titleMax80'),
})

export const folderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'validation.titleEmpty')
    .max(60, 'validation.titleMax'),
})

export type FolderValues = z.infer<typeof folderSchema>
export type CollectionValues = z.infer<typeof collectionSchema>
export type CollectionSettingsValues = z.infer<typeof collectionSettingsSchema>
export type EndpointValues = z.infer<typeof endpointSchema>
