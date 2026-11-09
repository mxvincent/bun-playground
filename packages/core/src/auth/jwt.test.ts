import { describe, expect, test } from 'bun:test'
import { generateKeyPairSync, type KeyObject, randomBytes } from 'node:crypto'
import { type SignOptions, sign } from 'jsonwebtoken'
import { AuthTokenError } from './errors'
import { getKeyIdHeader, verifyToken } from './jwt'
import { JWTAlgorithm } from './types'

const SECRET = randomBytes(32).toString('hex')

const pemKeyPair = (keyPair: { privateKey: KeyObject; publicKey: KeyObject }) => ({
	signingKey: keyPair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
	verifyingKey: keyPair.publicKey.export({ type: 'spki', format: 'pem' }).toString()
})

// Generated once: RSA keys serve RS and PS algorithms, each ECDSA algorithm has its own curve
const HMAC = { signingKey: SECRET, verifyingKey: SECRET }
const RSA = pemKeyPair(generateKeyPairSync('rsa', { modulusLength: 2048 }))
const EC = {
	ES256: pemKeyPair(generateKeyPairSync('ec', { namedCurve: 'P-256' })),
	ES384: pemKeyPair(generateKeyPairSync('ec', { namedCurve: 'P-384' })),
	ES512: pemKeyPair(generateKeyPairSync('ec', { namedCurve: 'P-521' }))
}

const AUDIENCE = 'https://valid.com'
const ISSUER = 'https://valid.com'

// A Record: adding an algorithm to JWTAlgorithm without keys here fails type-checking
const KEYS: Record<JWTAlgorithm, { signingKey: string; verifyingKey: string }> = {
	HS256: HMAC,
	HS384: HMAC,
	HS512: HMAC,
	RS256: RSA,
	RS384: RSA,
	RS512: RSA,
	ES256: EC.ES256,
	ES384: EC.ES384,
	ES512: EC.ES512,
	PS256: RSA,
	PS384: RSA,
	PS512: RSA
}

describe.each(
	Object.values(JWTAlgorithm).map((algorithm) => ({ algorithm, ...KEYS[algorithm] }))
)('verifyToken() with $algorithm', ({ algorithm, signingKey, verifyingKey }) => {
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
