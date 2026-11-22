import { AuthError } from './auth'

/**
 * Stable reason of an invalid token. It never carries an expected claim value, since it reaches the client.
 */
export type AuthTokenErrorReason =
	| 'malformed'
	| 'invalid-signature'
	| 'invalid-algorithm'
	| 'invalid-audience'
	| 'invalid-issuer'
	| 'invalid-subject'
	| 'invalid-jwt-id'
	| 'invalid-nonce'
	| 'invalid-claims'
	| 'invalid'

export type AuthTokenErrorDetails = {
	reason?: AuthTokenErrorReason
	notBefore?: string
	expiredAt?: string
}

/**
 * A token is malformed, expired, not active yet, or its signature or claims are not valid
 */
export class AuthTokenError extends AuthError<AuthTokenErrorDetails> {
	override code = 'INVALID_TOKEN'
}
