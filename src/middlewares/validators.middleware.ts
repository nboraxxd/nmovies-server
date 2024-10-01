import omit from 'lodash/omit'
import { Schema, ZodError } from 'zod'
import { JsonWebTokenError } from 'jsonwebtoken'
import { NextFunction, Request, Response } from 'express'

import { decodeAuthorizationToken } from '@/utils/jwt'
import { capitalizeFirstLetter } from '@/utils/common'
import { HttpStatusCode } from '@/constants/http-status-code'
import { EntityError, ErrorWithStatusAndLocation } from '@/models/errors'
import { authorizationSchema } from '@/schemas/auth.schema'

export type ValidationLocation = 'body' | 'params' | 'query' | 'headers'

export const zodValidator = (
  schema: Schema,
  location: ValidationLocation,
  customHandler?: (arg: Request) => Promise<void>
) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req[location] = await schema.parseAsync(req[location])

      if (customHandler) {
        await customHandler(req)
      }

      next()
    } catch (error) {
      if (error instanceof ZodError) {
        if (location === 'body') {
          next(
            new EntityError({
              message: `Validation error occurred in ${location}`,
              errors: error.errors.map((error) => ({
                code: error.code,
                message: error.message,
                path: error.path.join('.'),
                location,
              })),
            })
          )
        } else {
          next(
            new ErrorWithStatusAndLocation({
              message: `Error occurred in ${location}`,
              statusCode: HttpStatusCode.BadRequest,
              location,
              errorInfo: error.errors.map((error) => ({
                message: error.message,
                path: error.path.join('.'),
              })),
            })
          )
        }
      } else {
        next(error)
      }
    }
  }
}

export const loginValidator = (isOptional = false) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const accessToken = req.headers.authorization?.split('Bearer ')[1]

      if (!isOptional) {
        const { authorization: parsedAccessToken } = await authorizationSchema.parseAsync({
          authorization: accessToken,
        })
        await decodeAuthorizationToken(parsedAccessToken, req)
      } else if (isOptional && accessToken) {
        await decodeAuthorizationToken(accessToken, req)
      }

      next()
    } catch (error) {
      if (isOptional) {
        next()
        return
      }

      if (error instanceof ZodError) {
        next(
          new ErrorWithStatusAndLocation({
            message: error.errors.map((error) => error.message).join(', '),
            statusCode: HttpStatusCode.Unauthorized,
            location: 'headers',
          })
        )
      } else if (error instanceof JsonWebTokenError) {
        next(
          new ErrorWithStatusAndLocation({
            message: capitalizeFirstLetter(error.message),
            statusCode: HttpStatusCode.Unauthorized,
            location: 'headers',
            errorInfo: omit(error, ['message']),
          })
        )
      } else {
        next(error)
      }
    }
  }
}

export const tokenValidator = (schema: Schema, tokenHandler?: (req: Request) => Promise<void>) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body)

      if (tokenHandler) {
        await tokenHandler(req)
      }

      next()
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new ErrorWithStatusAndLocation({
            message: error.errors.map((error) => error.message).join(', '),
            statusCode: HttpStatusCode.Unauthorized,
            location: 'body',
            errorInfo: error.errors.map((error) => ({
              code: error.code,
              message: error.message,
              path: error.path.join('.'),
            })),
          })
        )
      } else if (error instanceof JsonWebTokenError) {
        next(
          new ErrorWithStatusAndLocation({
            message: capitalizeFirstLetter(error.message),
            statusCode: HttpStatusCode.Unauthorized,
            location: 'body',
            errorInfo: omit(error, ['message']),
          })
        )
      } else {
        next(error)
      }
    }
  }
}
