import { AuthError } from './auth'

/**
 * The JSON Web Key Set used to verify tokens cannot be read: the server is at fault, not the token
 */
export class AuthJWKSError extends AuthError {
	override code = 'AUTH_JWKS_ERROR'
	override statusCode = 500
}
