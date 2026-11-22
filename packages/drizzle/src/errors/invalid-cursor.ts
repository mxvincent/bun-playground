import { BaseError } from '@package/errors'

/**
 * A pagination cursor sent by a client cannot be decoded
 */
export class DrizzleInvalidCursorError extends BaseError {
	code = 'DRIZZLE_INVALID_CURSOR'
	override statusCode = 400

	constructor(options?: { cause?: unknown }) {
		super('Invalid cursor format', options)
	}
}
