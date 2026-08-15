import { z } from 'zod'

export const collectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nom kamida 2 belgidan iborat bo‘lishi kerak')
    .max(60, 'Nom 60 belgidan oshmasligi kerak'),
  description: z.string().trim().max(200, 'Tavsif 200 belgidan oshmasligi kerak'),
})

export const collectionSettingsSchema = z.object({
  name: collectionSchema.shape.name,
  description: collectionSchema.shape.description,
  baseUrl: z.union([z.url('Havola noto‘g‘ri'), z.literal('')]),
})

export const endpointSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nom kiritilmagan')
    .max(80, 'Nom 80 belgidan oshmasligi kerak'),
})

export const folderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nom kiritilmagan')
    .max(60, 'Nom 60 belgidan oshmasligi kerak'),
})

export type FolderValues = z.infer<typeof folderSchema>
export type CollectionValues = z.infer<typeof collectionSchema>
export type CollectionSettingsValues = z.infer<typeof collectionSettingsSchema>
export type EndpointValues = z.infer<typeof endpointSchema>
