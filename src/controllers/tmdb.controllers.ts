import { Request, Response } from 'express'

import tmdbService from '@/services/tmdb.services'
import {
  DiscoverParamsType,
  DiscoverQueryType,
  DiscoverResponseType,
  TrendingParamsType,
  TrendingQueryType,
  TrendingResponseType,
  TopRatedResponseType,
  TopRatedQueryType,
  TopRatedParamsType,
} from '@/schemas/tmdb.schema'

export const discoverController = async (
  req: Request<DiscoverParamsType, any, any, DiscoverQueryType>,
  res: Response<DiscoverResponseType>
) => {
  const { mediaType } = req.params
  const { page, includeAdult, includeVideo, sortBy, voteAverageGte, voteAverageLte, withGenres } = req.query

  const { data, pagination } = await tmdbService.discover({
    page,
    mediaType,
    includeAdult,
    includeVideo,
    sortBy,
    withGenres,
    voteAverageGte,
    voteAverageLte,
  })

  return res.json({ message: 'Get discover list successfully', data, pagination })
}

export const trendingController = async (
  req: Request<TrendingParamsType, any, any, TrendingQueryType>,
  res: Response<TrendingResponseType>
) => {
  const { trendingType, timeWindow } = req.params
  const { page } = req.query

  const { data, pagination } = await tmdbService.trending({
    trendingType,
    timeWindow,
    page,
  })

  return res.json({ message: 'Get trending list successfully', data, pagination })
}

export const topRatedController = async (
  req: Request<TopRatedParamsType, any, any, TopRatedQueryType>,
  res: Response<TopRatedResponseType>
) => {
  const { topRatedType } = req.params
  const { page } = req.query

  const { data, pagination } = await tmdbService.topRated({ topRatedType, page })

  return res.json({ message: 'Get top rated list successfully', data, pagination })
}
