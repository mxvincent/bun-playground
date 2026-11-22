import * as jwt from 'jsonwebtoken'
import type { JwksClient } from 'jwks-rsa'
import { AuthTokenError, type AuthTokenErrorReason } from '../errors/auth-token'

// jsonwebtoken reports every failure but expiry and activation as one JsonWebTokenError without a code:
// its message prefix is the only way to tell them apart. The message itself is never exposed, since it
// can contain the expected audience, issuer, subject, jwt id or nonce.
const REASON_BY_MESSAGE_PREFIX: [prefix: string, reason: AuthTokenErrorReason][] = [
	['jwt malformed', 'malformed'],
	['jwt must be', 'malformed'],
	['invalid token', 'malformed'],
	['invalid signature', 'invalid-signature'],
	['jwt signature is required', 'invalid-signature'],
	['invalid algorithm', 'invalid-algorithm'],
	['jwt audience invalid', 'invalid-audience'],
	['jwt issuer invalid', 'invalid-issuer'],
	['jwt subject invalid', 'invalid-subject'],
	['jwt jwtid invalid', 'invalid-jwt-id'],
	['jwt nonce invalid', 'invalid-nonce'],
	['invalid exp value', 'invalid-claims'],
	['invalid nbf value', 'invalid-claims'],
	['iat required', 'invalid-claims']
]

const tokenErrorReason = (error: Error): AuthTokenErrorReason =>
	REASON_BY_MESSAGE_PREFIX.find(([prefix]) => error.message.startsWith(prefix))?.[1] ?? 'invalid'

/**
 * Decode token to get signing key id from headers
 * @throws {AuthTokenError}
 */
export const getKeyIdHeader = (token: string): string => {
	const decoded = jwt.decode(token, { complete: true })
	if (!decoded?.header.kid) {
		throw new AuthTokenError('Key id header is missing')
	}
	return decoded.header.kid
}

export const verifyToken = async <T extends Record<string, unknown>>(
	token: string,
	key: string,
	options: jwt.VerifyOptions
): Promise<T> => {
	return new Promise((resolve, reject) => {
		jwt.verify(token, key, options, (error, claims) => {
			if (error) {
				if (error instanceof jwt.TokenExpiredError) {
					return reject(
						new AuthTokenError(`This token is expired`, {
							expiredAt: error.expiredAt.toISOString()
						})
					)
				}
				if (error instanceof jwt.NotBeforeError) {
					return reject(
						new AuthTokenError(`This token cannot yet be used`, {
							notBefore: error.date.toISOString()
						})
					)
				}
				return reject(new AuthTokenError(`Token invalid`, { reason: tokenErrorReason(error) }))
			} else {
				resolve(claims as T)
			}
		})
	})
}

/**
 * Verify a token with the JWKS key named by its `kid` header.
 * When the token has no `kid` header, try every key of the JWKS.
 * @throws {AuthTokenError}
 */
export const getKeyAndVerify = async <T extends Record<string, unknown>>(
	token: string,
	jwks: JwksClient,
	options: jwt.VerifyOptions
): Promise<T> => {
	const keyId = jwt.decode(token, { complete: true })?.header.kid
	if (keyId) {
		const key = await jwks.getSigningKey(keyId)
		return await verifyToken<T>(token, key.getPublicKey(), options)
	}
	for (const key of await jwks.getSigningKeys()) {
		try {
			return await verifyToken<T>(token, key.getPublicKey(), options)
		} catch {
			// try the next key
		}
	}
	throw new AuthTokenError(`Token invalid`, { reason: 'invalid-signature' })
}
