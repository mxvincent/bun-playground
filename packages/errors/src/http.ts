import { AuthorizationError, BaseError } from './base'
import { ValidationError } from './validation'

export class BadRequestError<T = unknown> extends ValidationError<T> {
	override code = 'BAD_REQUEST'
}

export class UnauthorizedError extends AuthorizationError {
	code = 'UNAUTHORIZED'
	override statusCode = 401
}

export class ForbiddenError extends AuthorizationError {
	code = 'FORBIDDEN'
	override statusCode = 403
}

export class NotFoundError extends BaseError {
	code = 'NOT_FOUND'
	override statusCode = 404
}

export class MethodNotAllowedError extends BaseError {
	code = 'METHOD_NOT_ALLOWED'
	override statusCode = 405
}

export class ConflictError extends BaseError {
	code = 'CONFLICT'
	override statusCode = 409
}

export class UnsupportedMediaTypeError extends BaseError {
	code = 'UNSUPPORTED_MEDIA_TYPE'
	override statusCode = 415
}

export class UnprocessableEntityError extends BaseError {
	code = 'UNPROCESSABLE_ENTITY'
	override statusCode = 422
}

export class InternalServerError extends BaseError {
	code = 'INTERNAL_SERVER_ERROR'
	override statusCode = 500
}

export class NotImplementedError extends BaseError {
	code = 'NOT_IMPLEMENTED'
	override statusCode = 501
}
