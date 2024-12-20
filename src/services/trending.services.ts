import http from '@/utils/http'
import { buildTMDBImageUrl } from '@/utils/common'
import favoritesService from '@/services/favorites.services'
import { TVDataType } from '@/schemas/tv.schema'
import { MovieDataType } from '@/schemas/movies.schema'
import { TrendingParamsType, TrendingResponseType } from '@/schemas/trending.shema'
import { PageQueryType, TMDBTrendingResponseType } from '@/schemas/common-media.schema'

class TrendingService {
  async trending(
    payload: TrendingParamsType & PageQueryType & { userId?: string }
  ): Promise<Omit<TrendingResponseType, 'message'>> {
    const { timeWindow, trendingType, page, userId } = payload

    const response = await http.get<TMDBTrendingResponseType>(`/trending/${trendingType}/${timeWindow}`, {
      params: { page },
    })

    const mediaFavoritesMap = await favoritesService.getMediaFavoritesMap({
      medias: response.results.map((item) => ({ id: item.id, type: item.media_type })),
      userId,
    })

    return {
      data: response.results.map((item) => {
        const backdropUrl = buildTMDBImageUrl({ imagePath: item.backdrop_path, imageType: 'backdrop' })
        const posterUrl = buildTMDBImageUrl({ imagePath: item.poster_path, imageType: 'poster' })

        const data: TVDataType | MovieDataType =
          item.media_type === 'movie'
            ? {
                mediaType: item.media_type,
                adult: item.adult,
                backdropPath: backdropUrl,
                genreIds: item.genre_ids,
                id: item.id,
                originalLanguage: item.original_language,
                originalTitle: item.original_title,
                isFavorite: userId ? (mediaFavoritesMap[item.id]?.includes(item.media_type) ?? false) : null,
                overview: item.overview,
                popularity: item.popularity,
                posterPath: posterUrl,
                releaseDate: item.release_date,
                title: item.title,
                video: item.video,
                voteAverage: item.vote_average,
                voteCount: item.vote_count,
              }
            : {
                mediaType: item.media_type,
                adult: item.adult,
                backdropPath: backdropUrl,
                firstAirDate: item.first_air_date,
                genreIds: item.genre_ids,
                id: item.id,
                isFavorite: userId ? (mediaFavoritesMap[item.id]?.includes(item.media_type) ?? false) : null,
                name: item.name,
                originCountry: item.origin_country,
                originalLanguage: item.original_language,
                originalName: item.original_name,
                overview: item.overview,
                popularity: item.popularity,
                posterPath: posterUrl,
                voteAverage: item.vote_average,
                voteCount: item.vote_count,
              }

        return data
      }),
      pagination: { currentPage: response.page, totalPages: response.total_pages, count: response.total_results },
    }
  }
}

const trendingService = new TrendingService()
export default trendingService
