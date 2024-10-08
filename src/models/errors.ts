import multer from 'multer'
import { ZodIssueCode } from 'zod'
import { HttpStatusCode, TStatusCode } from '@/constants/http-status-code'
import { ValidationLocation } from '@/middlewares/validators.middleware'

type ErrorsType = {
  code: ZodIssueCode | multer.ErrorCode
  message: string
  path: string
  location: ValidationLocation
}[]

export class ErrorWithStatus extends Error {
  statusCode: TStatusCode
  errorInfo?: Record<string, any>

  constructor({
    message,
    statusCode,
    errorInfo,
  }: {
    message: string
    statusCode: TStatusCode
    errorInfo?: Record<string, any>
  }) {
    super(message)
    this.statusCode = statusCode
    this.errorInfo = errorInfo
  }
}

export class ErrorWithStatusAndLocation extends ErrorWithStatus {
  location: ValidationLocation
  errorInfo?: Record<string, any>

  constructor({
    message,
    statusCode,
    location,
    errorInfo,
  }: {
    message: string
    statusCode: TStatusCode
    location: ValidationLocation
    errorInfo?: Record<string, any>
  }) {
    super({ message, statusCode })
    this.location = location
    this.errorInfo = errorInfo
  }
}

export class EntityError extends ErrorWithStatus {
  errors: ErrorsType

  constructor({ message = 'Validation error', errors }: { message?: string; errors: ErrorsType }) {
    super({ message, statusCode: HttpStatusCode.UnprocessableEntity })
    this.errors = errors
  }
}
