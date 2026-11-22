import { AuthorizationError } from '@package/errors'

/**
 * A request cannot be authenticated. `details` carries the context of the failure.
 */
export class AuthError<Details extends Record<string, unknown> = Record<string, unknown>> extends AuthorizationError {
	code = 'AUTH_ERROR'
	override statusCode = 401
	readonly details?: Details

	constructor(message: string, details?: Details) {
		super(message)
		this.details = details
	}

	override toJSON() {
		return { ...super.toJSON(), details: this.details }
	}
}
