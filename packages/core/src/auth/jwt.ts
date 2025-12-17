import * as assert from 'node:assert'
import type { VerifyOptions } from 'jsonwebtoken'
import * as jwt from 'jsonwebtoken'
import type { JwksClient } from 'jwks-rsa'
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

export const getKeyAndVerify = async <T extends Record<string, unknown>>(
	token: string,
	jwks: JwksClient,
	options: jwt.VerifyOptions
): Promise<T> => {
	const keyId = getKeyIdHeader(token)
	if (keyId) {
		const key = await jwks.getSigningKey(keyId)
		return await verifyToken<T>(token, key.getPublicKey(), options)
	}
	const keys = await jwks.getSigningKeys()
	const verifyTokenWithKey = async (token: string, keyIndex: number, options: VerifyOptions): Promise<T> => {
		const key = keys.at(keyIndex)
		assert.ok(key, 'not valid key index provided')
		try {
			return await verifyToken<T>(token, key.getPublicKey(), options)
		} catch {
			if (keys.at(keyIndex + 1)) {
				return verifyTokenWithKey(token, keyIndex + 1, options)
			} else {
				throw new AuthTokenError(`Token invalid`, {
					reason: `Token signature is not valid`
				})
			}
		}
	}
	return await verifyTokenWithKey(token, 0, options)
}
