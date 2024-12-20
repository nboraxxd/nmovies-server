import http from '@/utils/http'
import { buildTMDBImageUrl } from '@/utils/common'
import {
  PageQueryType,
  TMDBDiscoverTvResponseType,
  TMDBGenresResponseType,
  TMDBRecommendedTvsResponseType,
  TMDBSearchTvsResponseType,
  TMDBTopRatedTvResponseType,
  TMDBTvAggregateCreditsResponseType,
  TMDBTvDetailResponseType,
} from '@/schemas/common-media.schema'
import {
  DiscoverTvsQueryType,
  DiscoverTvsResponseType,
  RecommendedTvsResponseType,
  SearchTvsResponseType,
  TopRatedTvsResponseType,
  TvAggregateCreditsResponseType,
  TvCastType,
  TvCrewType,
  TVDataType,
  TvDetailDataType,
  GenresTvResponseType,
} from '@/schemas/tv.schema'
import { MovieDataType } from '@/schemas/movies.schema'
import favoritesService from '@/services/favorites.services'

class TVsService {
  async discoverTvs(
    payload: DiscoverTvsQueryType & { userId?: string }
  ): Promise<Omit<DiscoverTvsResponseType, 'message'>> {
    const { page, sortBy, voteAverageGte, voteAverageLte, withGenres, userId } = payload

    const response = await http.get<TMDBDiscoverTvResponseType>('/discover/tv', {
      params: {
        page,
        sort_by: sortBy,
        'vote_average.gte': voteAverageGte,
        'vote_average.lte': voteAverageLte,
        with_genres: withGenres,
      },
    })

    const mediaFavoritesMap = await favoritesService.getMediaFavoritesMap({
      medias: response.results.map((item) => ({ id: item.id, type: 'tv' })),
      userId,
    })

    return {
      data: response.results.map<TVDataType>(({ backdrop_path, poster_path, ...item }) => {
        return {
          adult: item.adult,
          firstAirDate: item.first_air_date,
          genreIds: item.genre_ids,
          id: item.id,
          mediaType: 'tv',
          name: item.name,
          originalLanguage: item.original_language,
          overview: item.overview,
          originCountry: item.origin_country,
          originalName: item.original_name,
          popularity: item.popularity,
          voteAverage: item.vote_average,
          voteCount: item.vote_count,
          backdropPath: buildTMDBImageUrl({ imagePath: backdrop_path, imageType: 'backdrop' }),
          posterPath: buildTMDBImageUrl({ imagePath: poster_path, imageType: 'poster' }),
          isFavorite: userId ? (mediaFavoritesMap[item.id]?.includes('tv') ?? false) : null,
        }
      }),
      pagination: { currentPage: response.page, totalPages: response.total_pages, count: response.total_results },
    }
  }

  async topRatedTvs({
    page,
    userId,
  }: PageQueryType & { userId?: string }): Promise<Omit<TopRatedTvsResponseType, 'message'>> {
    const response = await http.get<TMDBTopRatedTvResponseType>('/tv/top_rated', { params: { page } })

    const mediaFavoritesMap = await favoritesService.getMediaFavoritesMap({
      medias: response.results.map((item) => ({ id: item.id, type: 'tv' })),
      userId,
    })

    return {
      data: response.results.map<TVDataType>(({ backdrop_path, poster_path, ...item }) => {
        return {
          adult: item.adult,
          genreIds: item.genre_ids,
          backdropPath: buildTMDBImageUrl({ imagePath: backdrop_path, imageType: 'backdrop' }),
          id: item.id,
          originalLanguage: item.original_language,
          isFavorite: userId ? (mediaFavoritesMap[item.id]?.includes('tv') ?? false) : null,
          originalName: item.original_name,
          overview: item.overview,
          popularity: item.popularity,
          posterPath: buildTMDBImageUrl({ imagePath: poster_path, imageType: 'poster' }),
          firstAirDate: item.first_air_date,
          name: item.name,
          mediaType: 'tv',
          originCountry: item.origin_country,
          voteAverage: item.vote_average,
          voteCount: item.vote_count,
        }
      }),
      pagination: { currentPage: response.page, totalPages: response.total_pages, count: response.total_results },
    }
  }

  async searchTvs(payload: {
    query: string
    page?: number
    userId?: string
  }): Promise<Omit<SearchTvsResponseType, 'message'>> {
    const { page, query, userId } = payload

    const response = await http.get<TMDBSearchTvsResponseType>('/search/tv', { params: { page, query } })

    const mediaFavoritesMap = await favoritesService.getMediaFavoritesMap({
      medias: response.results.map((item) => ({ id: item.id, type: 'tv' })),
      userId,
    })

    return {
      data: response.results.map<TVDataType>(({ backdrop_path, poster_path, ...item }) => {
        return {
          adult: item.adult,
          genreIds: item.genre_ids,
          backdropPath: buildTMDBImageUrl({ imagePath: backdrop_path, imageType: 'backdrop' }),
          id: item.id,
          originalLanguage: item.original_language,
          isFavorite: userId ? (mediaFavoritesMap[item.id]?.includes('tv') ?? false) : null,
          originalName: item.original_name,
          overview: item.overview,
          popularity: item.popularity,
          posterPath: buildTMDBImageUrl({ imagePath: poster_path, imageType: 'poster' }),
          firstAirDate: item.first_air_date,
          name: item.name,
          mediaType: 'tv',
          originCountry: item.origin_country,
          voteAverage: item.vote_average,
          voteCount: item.vote_count,
        }
      }),
      pagination: { currentPage: response.page, totalPages: response.total_pages, count: response.total_results },
    }
  }

  async getTvDetail(tvId: number): Promise<TvDetailDataType> {
    const response = await http.get<TMDBTvDetailResponseType>(`/tv/${tvId}`, {
      params: { append_to_response: 'content_ratings,videos' },
    })

    const certification = response.content_ratings.results.find((item) => item.iso_3166_1 === 'US')?.rating ?? null

    return {
      adult: response.adult,
      backdropPath: buildTMDBImageUrl({ imagePath: response.backdrop_path, imageType: 'backdrop' }),
      certification,
      createdBy: response.created_by.map((item) => ({
        creditId: item.credit_id,
        gender: item.gender,
        id: item.id,
        name: item.name,
        originalName: item.original_name,
        profilePath: item.profile_path,
      })),
      episodeRunTime: response.episode_run_time,
      firstAirDate: response.first_air_date,
      genres: response.genres,
      homepage: response.homepage,
      id: response.id,
      inProduction: response.in_production,
      languages: response.languages,
      lastAirDate: response.last_air_date,
      lastEpisodeToAir: response.last_episode_to_air
        ? {
            airDate: response.last_episode_to_air.air_date,
            episodeNumber: response.last_episode_to_air.episode_number,
            episodeType: response.last_episode_to_air.episode_type,
            id: response.last_episode_to_air.id,
            name: response.last_episode_to_air.name,
            overview: response.last_episode_to_air.overview,
            productionCode: response.last_episode_to_air.production_code,
            seasonNumber: response.last_episode_to_air.season_number,
            showId: response.last_episode_to_air.show_id,
            stillPath: response.last_episode_to_air.still_path,
            runtime: response.last_episode_to_air.runtime,
            voteAverage: response.last_episode_to_air.vote_average,
            voteCount: response.last_episode_to_air.vote_count,
          }
        : null,
      name: response.name,
      networks: response.networks.map((item) => ({
        id: item.id,
        logoPath: item.logo_path,
        name: item.name,
        originCountry: item.origin_country,
      })),
      nextEpisodeToAir: response.next_episode_to_air
        ? {
            airDate: response.next_episode_to_air.air_date,
            episodeNumber: response.next_episode_to_air.episode_number,
            episodeType: response.next_episode_to_air.episode_type,
            id: response.next_episode_to_air.id,
            name: response.next_episode_to_air.name,
            overview: response.next_episode_to_air.overview,
            productionCode: response.next_episode_to_air.production_code,
            runtime: response.next_episode_to_air.runtime,
            seasonNumber: response.next_episode_to_air.season_number,
            showId: response.next_episode_to_air.show_id,
            stillPath: response.next_episode_to_air.still_path,
            voteAverage: response.next_episode_to_air.vote_average,
            voteCount: response.next_episode_to_air.vote_count,
          }
        : null,
      numberOfEpisodes: response.number_of_episodes,
      numberOfSeasons: response.number_of_seasons,
      originCountry: response.origin_country,
      originalLanguage: response.original_language,
      originalName: response.original_name,
      overview: response.overview,
      popularity: response.popularity,
      posterPath: buildTMDBImageUrl({ imagePath: response.poster_path, imageType: 'poster' }),
      productionCompanies: response.production_companies.map((item) => ({
        id: item.id,
        logoPath: item.logo_path,
        name: item.name,
        originCountry: item.origin_country,
      })),
      productionCountries: response.production_countries.map((item) => ({
        iso31661: item.iso_3166_1,
        name: item.name,
      })),
      seasons: response.seasons.map((item) => ({
        airDate: item.air_date,
        episodeCount: item.episode_count,
        id: item.id,
        name: item.name,
        overview: item.overview,
        posterPath: item.poster_path,
        seasonNumber: item.season_number,
        voteAverage: item.vote_average,
      })),
      spokenLanguages: response.spoken_languages.map((item) => ({
        englishName: item.english_name,
        iso6391: item.iso_639_1,
        name: item.name,
      })),
      status: response.status,
      type: response.type,
      videos: {
        results: response.videos.results.map((item) => ({
          id: item.id,
          iso6391: item.iso_639_1,
          iso31661: item.iso_3166_1,
          key: item.key,
          name: item.name,
          site: item.site,
          official: item.official,
          publishedAt: item.published_at,
          size: item.size,
          type: item.type,
        })),
      },
      voteAverage: response.vote_average,
      voteCount: response.vote_count,
    }
  }

  async getTvAggregateCredits(tvId: number): Promise<TvAggregateCreditsResponseType['data']> {
    const response = await http.get<TMDBTvAggregateCreditsResponseType>(`/tv/${tvId}/aggregate_credits`)

    const formattedCrew = response.crew.map<TvCrewType>((item) => {
      return {
        adult: item.adult,
        department: item.department,
        gender: item.gender,
        id: item.id,
        jobs: item.jobs.map((job) => ({
          creditId: job.credit_id,
          job: job.job,
          episodeCount: job.episode_count,
        })),
        knownForDepartment: item.known_for_department,
        name: item.name,
        originalName: item.original_name,
        popularity: item.popularity,
        profilePath: buildTMDBImageUrl({ imagePath: item.profile_path, imageType: 'profile' }),
        totalEpisodeCount: item.total_episode_count,
      }
    })

    const formattedCast = response.cast.map<TvCastType>((item) => {
      return {
        adult: item.adult,
        gender: item.gender,
        id: item.id,
        knownForDepartment: item.known_for_department,
        name: item.name,
        order: item.order,
        originalName: item.original_name,
        popularity: item.popularity,
        profilePath: buildTMDBImageUrl({ imagePath: item.profile_path, imageType: 'profile' }),
        roles: item.roles.map((role) => ({
          creditId: role.credit_id,
          character: role.character,
          episodeCount: role.episode_count,
        })),
        totalEpisodeCount: item.total_episode_count,
      }
    })

    return { cast: formattedCast, crew: formattedCrew }
  }

  async getRecommendedTvs(payload: {
    tvId: number
    userId: string | undefined
  }): Promise<Omit<RecommendedTvsResponseType, 'message'>> {
    const { tvId, userId } = payload

    const response = await http.get<TMDBRecommendedTvsResponseType>(`/tv/${tvId}/recommendations`)

    const filteredResults = response.results.filter((item) => item.media_type === 'movie' || item.media_type === 'tv')

    const tvFavoritesMap = await favoritesService.getMediaFavoritesMap({
      medias: filteredResults.map((item) => ({ id: item.id, type: 'tv' })),
      userId,
    })

    return {
      data: filteredResults.map<MovieDataType | TVDataType>((item) => {
        const backdropUrl = buildTMDBImageUrl({ imagePath: item.backdrop_path, imageType: 'backdrop' })
        const posterUrl = buildTMDBImageUrl({ imagePath: item.poster_path, imageType: 'poster' })

        return item.media_type === 'movie'
          ? {
              mediaType: 'movie',
              adult: item.adult,
              backdropPath: backdropUrl,
              genreIds: item.genre_ids,
              id: item.id,
              isFavorite: userId ? (tvFavoritesMap[item.id]?.includes('movie') ?? false) : null,
              originalLanguage: item.original_language,
              originalTitle: item.original_title,
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
              mediaType: 'tv',
              adult: item.adult,
              backdropPath: backdropUrl,
              genreIds: item.genre_ids,
              id: item.id,
              firstAirDate: item.first_air_date,
              isFavorite: userId ? (tvFavoritesMap[item.id]?.includes('tv') ?? false) : null,
              name: item.name,
              originCountry: item.origin_country,
              originalLanguage: item.original_language,
              overview: item.overview,
              originalName: item.original_name,
              popularity: item.popularity,
              posterPath: posterUrl,
              voteAverage: item.vote_average,
              voteCount: item.vote_count,
            }
      }),
      pagination: { currentPage: response.page, totalPages: response.total_pages, count: response.total_results },
    }
  }

  async getTvGenres(): Promise<GenresTvResponseType['data']> {
    const response = await http.get<TMDBGenresResponseType>('/genre/tv/list')

    return response.genres
  }
}

const tvsService = new TVsService()
export default tvsService
