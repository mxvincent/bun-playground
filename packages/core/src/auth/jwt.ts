import * as jwt from 'jsonwebtoken'
import { AuthTokenError } from './errors'

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
				return reject(new AuthTokenError(`Token invalid`, { reason: error.message }))
			} else {
				resolve(claims as T)
			}
		})
	})
}
