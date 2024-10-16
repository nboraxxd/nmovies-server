import { paginationResponseSchema, queryPageSchema } from '@/schemas/common.schema'
import z from 'zod'

const favoriteDocumentSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  mediaId: z.number(),
  mediaTitle: z.string(),
  mediaType: z.enum(['movie', 'tv']),
  mediaPoster: z.string().nullable(),
  mediaReleaseDate: z.string(),
  createdAt: z.date(),
})

export type FavoriteDocumentType = z.TypeOf<typeof favoriteDocumentSchema>

export const addFavoriteBodySchema = z
  .object({
    mediaId: z.number(),
    mediaTitle: z.string(),
    mediaType: z.enum(['movie', 'tv']),
    mediaPoster: z.string().nullable(),
    mediaReleaseDate: z.string(),
  })
  .strict({ message: 'Additional properties not allowed' })

export type AddFavoriteBodyType = z.TypeOf<typeof addFavoriteBodySchema>

export const addFavoriteResponseSchema = z.object({
  message: z.string(),
  data: z.nullable(favoriteDocumentSchema),
})

export type AddFavoriteResponseType = z.TypeOf<typeof addFavoriteResponseSchema>

export const getFavoritesQuery = z.object({
  page: queryPageSchema,
})

export type GetFavoritesQueryType = z.TypeOf<typeof getFavoritesQuery>

export const getMyFavoritesResponseSchema = z.object({
  message: z.string(),
  data: z.array(favoriteDocumentSchema.omit({ userId: true })),
  pagination: paginationResponseSchema,
})

export type GetMyFavoritesResponseType = z.TypeOf<typeof getMyFavoritesResponseSchema>
