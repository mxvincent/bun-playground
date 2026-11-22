import { AuthError } from './auth'

export type AuthTokenErrorDetails = {
	reason?: string
	notBefore?: string
	expiredAt?: string
}

/**
 * A token is malformed, expired, not active yet, or its signature or claims are not valid
 */
export class AuthTokenError extends AuthError<AuthTokenErrorDetails> {
	override code = 'INVALID_TOKEN'
}
