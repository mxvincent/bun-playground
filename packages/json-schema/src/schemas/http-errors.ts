import type { ObjectOptions, TProperties } from '@sinclair/typebox'
import { Schema } from '../builder'

export const HttpErrorSchema = (
	options: Pick<ObjectOptions, 'description' | '$id'> & Partial<{ withProperties: TProperties }>
) => {
	return Schema.Object(
		{
			code: Schema.String(),
			message: Schema.String(),
			statusCode: Schema.Integer(),
			...options.withProperties
		},
		options
	)
}

export const NoContentResponseSchema = Schema.Null({
	$id: 'HTTP/NoContent',
	description: 'No content.'
})

/**
 * HTTP 400 Bad Request
 */
export const BadRequestResponseSchema = HttpErrorSchema({
	$id: 'HTTP/BadRequest',
	description: `The request was unacceptable, often due to missing a required parameter.`,
	withProperties: {
		errors: Schema.Optional(Schema.Any())
	}
})

/**
 * HTTP 401 Unauthorized
 */
export const UnauthorizedResponseSchema = HttpErrorSchema({
	$id: 'HTTP/Unauthorized',
	description: 'The client must be authenticated.'
})

/**
 * HTTP 403 Forbidden
 */
export const ForbiddenResponseSchema = HttpErrorSchema({
	$id: 'HTTP/Forbidden',
	description: 'The client does not have access rights to the content.'
})

/**
 * HTTP 404 Not Found
 */
export const NotFoundResponseSchema = HttpErrorSchema({
	$id: 'HTTP/NotFound',
	description: `The server can not find the requested resource.`
})

/**
 * HTTP 405 Method Not Allowed
 */
export const MethodNotAllowedSchema = HttpErrorSchema({
	$id: 'HTTP/MethodNotAllowed',
	description: `The request method is known by the server but is not supported by the target resource.`
})

/**
 * HTTP 409 Conflict
 */
export const ConflictResponseSchema = HttpErrorSchema({
	$id: 'HTTP/Conflict',
	description: 'The request conflicts with the server state.'
})

/**
 * HTTP 413 Payload Too Large
 */
export const PayloadTooLargeResponseSchema = HttpErrorSchema({
	$id: 'HTTP/PayloadTooLarge',
	description: 'Request entity is larger than limits defined by server.'
})

/**
 * HTTP 415 Unsupported Media Type
 */
export const UnsupportedMediaTypeResponseSchema = HttpErrorSchema({
	$id: 'HTTP/UnsupportedMediaType',
	description: 'The media format of the requested data is not supported by the server.'
})
