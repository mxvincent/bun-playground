import { describe, expect, test } from 'bun:test'
import { generateKeyPairSync, randomBytes } from 'node:crypto'
import { type SignOptions, sign } from 'jsonwebtoken'
import { AuthTokenError } from './errors'
import { getKeyIdHeader, verifyToken } from './jwt'
import { JWTAlgorithm } from './types'

const SECRET = randomBytes(32).toString('hex')
const RSA_KEY_PAIR = generateKeyPairSync('rsa', {
	modulusLength: 2048,
	publicKeyEncoding: { type: 'spki', format: 'pem' },
	privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
})

const AUDIENCE = 'https://valid.com'
const ISSUER = 'https://valid.com'

// One algorithm per key family: symmetric (HMAC) and asymmetric (RSA)
describe.each([
	{ algorithm: JWTAlgorithm.HS256, signingKey: SECRET, verifyingKey: SECRET },
	{ algorithm: JWTAlgorithm.RS256, signingKey: RSA_KEY_PAIR.privateKey, verifyingKey: RSA_KEY_PAIR.publicKey }
])('verifyToken() with $algorithm', ({ algorithm, signingKey, verifyingKey }) => {
	const payload = { key: 'value' }
	const signToken = (options?: SignOptions) =>
		sign(payload, signingKey, { algorithm, audience: AUDIENCE, issuer: ISSUER, expiresIn: '1h', ...options })
	const verify = (token: string) =>
		verifyToken(token, verifyingKey, { algorithms: [algorithm], audience: AUDIENCE, issuer: ISSUER })

	test('resolves the claims of a valid token', async () => {
		await expect(verify(signToken())).resolves.toMatchObject(payload)
	})

	test('rejects a token with another audience', async () => {
		await expect(verify(signToken({ audience: 'https://not.valid.com' }))).rejects.toThrow(
			new AuthTokenError('Token invalid')
		)
	})

	test('rejects a token with another issuer', async () => {
		await expect(verify(signToken({ issuer: 'https://not.valid.com' }))).rejects.toThrow(
			new AuthTokenError('Token invalid')
		)
	})

	test('rejects an expired token', async () => {
		await expect(verify(signToken({ expiresIn: '-1h' }))).rejects.toThrow(new AuthTokenError('This token is expired'))
	})

	test('rejects a token that is not active yet', async () => {
		await expect(verify(signToken({ notBefore: '1h', expiresIn: '2h' }))).rejects.toThrow(
			new AuthTokenError('This token cannot yet be used')
		)
	})
})

describe('getKeyIdHeader()', () => {
	test('returns the kid header', () => {
		expect(getKeyIdHeader(sign({}, SECRET, { keyid: 'key-1' }))).toBe('key-1')
	})

	test('throws when the kid header is missing', () => {
		expect(() => getKeyIdHeader(sign({}, SECRET))).toThrow(new AuthTokenError('Key id header is missing'))
	})
})
