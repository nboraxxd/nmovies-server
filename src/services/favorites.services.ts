import { ObjectId, WithId } from 'mongodb'

import Favorite from '@/models/favorite.model'
import { ErrorWithStatus } from '@/models/errors'
import { HttpStatusCode } from '@/constants/http-status-code'
import databaseService from '@/services/database.services'
import envVariables from '@/schemas/env-variables.schema'
import { MediaType } from '@/schemas/common-media.schema'
import { AddFavoriteBodyType, FavoriteDocumentType } from '@/schemas/favorite.schema'

class FavoritesService {
  async getMediaFavoritesMap(payload: { medias: Array<{ id: number; type: MediaType }>; userId?: string }) {
    const { medias, userId } = payload

    const mediaFavoritesMap: Record<number, Array<MediaType>> = {}

    if (userId && medias.length > 0) {
      const favoriteRecords = await databaseService.favorites
        .find(
          {
            userId: new ObjectId(userId),
            $or: medias.map((media) => ({
              mediaId: media.id,
              mediaType: media.type,
            })),
          },
          { projection: { mediaId: 1, mediaType: 1 } }
        )
        .toArray()

      for (const { mediaId, mediaType } of favoriteRecords) {
        if (mediaId in mediaFavoritesMap) {
          mediaFavoritesMap[mediaId].push(mediaType)
        } else {
          mediaFavoritesMap[mediaId] = [mediaType]
        }
      }
    }

    return mediaFavoritesMap
  }

  async addFavoriteMedia(payload: AddFavoriteBodyType & { userId: string }) {
    const { mediaId, mediaPoster, mediaReleaseDate, mediaTitle, mediaType, userId } = payload

    const favorite = await databaseService.favorites.findOneAndUpdate(
      { mediaId, userId: new ObjectId(userId) },
      {
        $setOnInsert: new Favorite({
          _id: new ObjectId(),
          userId: new ObjectId(userId),
          mediaId,
          mediaPoster,
          mediaReleaseDate,
          mediaTitle,
          mediaType,
        }),
      },
      {
        upsert: true,
        includeResultMetadata: true,
        returnDocument: 'after',
      }
    )

    return {
      data: favorite.value as WithId<Favorite>,
      isNew: favorite.lastErrorObject?.updatedExisting === false,
    }
  }

  async getFavorite(payload: { mediaId: number; mediaType: 'movie' | 'tv'; userId: string }) {
    const { mediaId, mediaType, userId } = payload

    return databaseService.favorites.findOne({ mediaId, mediaType, userId: new ObjectId(userId) })
  }

  async getMyFavorites(payload: { userId: string; cursor?: string }) {
    const { userId, cursor } = payload

    const [response] = await databaseService.favorites
      .aggregate<{
        data: WithId<Omit<FavoriteDocumentType, '_id' | 'userId'>>[]
        hasNextPage: boolean
      }>([
        {
          $match: {
            userId: new ObjectId(userId),
            ...(cursor ? { _id: { $lt: new ObjectId(cursor) } } : {}),
          },
        },
        {
          $facet: {
            data: [
              {
                $project: {
                  userId: 0,
                },
              },
              {
                $sort: {
                  createdAt: -1,
                },
              },
              {
                $limit: envVariables.FAVORITES_PER_PAGE_LIMIT + 1,
              },
            ],
          },
        },
        {
          $project: {
            data: {
              $slice: ['$data', envVariables.FAVORITES_PER_PAGE_LIMIT],
            },
            hasNextPage: {
              $gt: [{ $size: '$data' }, envVariables.FAVORITES_PER_PAGE_LIMIT],
            },
          },
        },
      ])
      .toArray()

    return response
  }

  async deleteFavoriteById({ favoriteId, userId }: { favoriteId: string; userId: string }) {
    // Phải deleteOne theo _id và userId
    // Vì để tránh trường hợp người dùng xóa favorite của người khác
    const result = await databaseService.favorites.deleteOne({
      _id: new ObjectId(favoriteId),
      userId: new ObjectId(userId),
    })

    if (result.deletedCount === 0) {
      throw new ErrorWithStatus({
        message: 'Favorite not found or does not belong to you.',
        statusCode: HttpStatusCode.NotFound,
      })
    }
  }

  async checkIsFavoriteByMedia(payload: { mediaId: number; mediaType: MediaType; userId: string }) {
    const { mediaId, mediaType, userId } = payload

    const favorite = await databaseService.favorites.findOne({
      mediaId,
      mediaType,
      userId: new ObjectId(userId),
    })

    return {
      isFavorite: !!favorite,
    }
  }

  async deleteFavoriteByMedia(payload: { mediaId: number; mediaType: MediaType; userId: string }) {
    const { mediaId, mediaType, userId } = payload

    const result = await databaseService.favorites.deleteOne({
      mediaId,
      mediaType,
      userId: new ObjectId(userId),
    })

    if (result.deletedCount === 0) {
      throw new ErrorWithStatus({
        message: 'Favorite not found or does not belong to you.',
        statusCode: HttpStatusCode.NotFound,
      })
    }
  }
}

const favoritesService = new FavoritesService()
export default favoritesService
