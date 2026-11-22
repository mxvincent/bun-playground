import { describe, expect, test } from 'bun:test'
import { createHmac, generateKeyPairSync, type KeyObject, randomBytes } from 'node:crypto'
import { type SignOptions, sign, type VerifyOptions } from 'jsonwebtoken'
import { AuthTokenError } from '../errors/auth-token'
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
			expect.objectContaining({
				constructor: AuthTokenError,
				code: 'INVALID_TOKEN',
				statusCode: 401,
				message: 'Token invalid',
				details: { reason: 'invalid-audience' }
			})
		)
	})

	test('rejects a token with another issuer', async () => {
		await expect(verify(signToken({ issuer: 'https://not.valid.com' }))).rejects.toThrow(
			expect.objectContaining({
				constructor: AuthTokenError,
				code: 'INVALID_TOKEN',
				statusCode: 401,
				message: 'Token invalid',
				details: { reason: 'invalid-issuer' }
			})
		)
	})

	test('rejects an expired token', async () => {
		await expect(verify(signToken({ expiresIn: '-1h' }))).rejects.toThrow(
			expect.objectContaining({
				constructor: AuthTokenError,
				code: 'INVALID_TOKEN',
				statusCode: 401,
				message: 'This token is expired',
				details: { expiredAt: expect.any(String) }
			})
		)
	})

	test('rejects a token that is not active yet', async () => {
		await expect(verify(signToken({ notBefore: '1h', expiresIn: '2h' }))).rejects.toThrow(
			expect.objectContaining({
				constructor: AuthTokenError,
				code: 'INVALID_TOKEN',
				statusCode: 401,
				message: 'This token cannot yet be used',
				details: { notBefore: expect.any(String) }
			})
		)
	})
})

describe('verifyToken() reason', () => {
	/** A HS256 token with any payload, even one that jsonwebtoken refuses to sign */
	const signRaw = (payload: Record<string, unknown>): string => {
		const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url')
		const content = `${encode({ alg: JWTAlgorithm.HS256, typ: 'JWT' })}.${encode(payload)}`
		return `${content}.${createHmac('sha256', SECRET).update(content).digest('base64url')}`
	}

	test.each<{ description: string; token: string; options?: VerifyOptions; key?: string; reason: string }>([
		{ description: 'a value that is not a token', token: 'not-a-token', reason: 'malformed' },
		{ description: 'an empty token', token: '', reason: 'malformed' },
		{ description: 'a token whose header is not JSON', token: 'a.b.c', reason: 'malformed' },
		{
			description: 'a token signed with another key',
			token: sign({}, SECRET),
			key: 'another-secret',
			reason: 'invalid-signature'
		},
		{ description: 'an unsigned token', token: sign({}, '', { algorithm: 'none' }), reason: 'invalid-signature' },
		{
			description: 'an algorithm that is not allowed',
			token: sign({}, SECRET, { algorithm: JWTAlgorithm.HS512 }),
			reason: 'invalid-algorithm'
		},
		{
			description: 'another audience',
			token: sign({ aud: 'a' }, SECRET),
			options: { audience: 'b' },
			reason: 'invalid-audience'
		},
		{
			description: 'another issuer',
			token: sign({ iss: 'a' }, SECRET),
			options: { issuer: 'b' },
			reason: 'invalid-issuer'
		},
		{
			description: 'another subject',
			token: sign({ sub: 'a' }, SECRET),
			options: { subject: 'b' },
			reason: 'invalid-subject'
		},
		{
			description: 'another jwt id',
			token: sign({ jti: 'a' }, SECRET),
			options: { jwtid: 'b' },
			reason: 'invalid-jwt-id'
		},
		{
			description: 'another nonce',
			token: sign({ nonce: 'a' }, SECRET),
			options: { nonce: 'b' },
			reason: 'invalid-nonce'
		},
		{ description: 'an exp claim that is not a number', token: signRaw({ exp: 'soon' }), reason: 'invalid-claims' },
		{ description: 'an nbf claim that is not a number', token: signRaw({ nbf: 'soon' }), reason: 'invalid-claims' },
		{
			description: 'a maxAge check on a token without iat',
			token: sign({}, SECRET, { noTimestamp: true }),
			options: { maxAge: '1h' },
			reason: 'invalid-claims'
		}
	])('is $reason for $description', async ({ token, options, key = SECRET, reason }) => {
		await expect(verifyToken(token, key, { algorithms: [JWTAlgorithm.HS256], ...options })).rejects.toThrow(
			expect.objectContaining({ constructor: AuthTokenError, message: 'Token invalid', details: { reason } })
		)
	})
})

describe('getKeyIdHeader()', () => {
	test('returns the kid header', () => {
		expect(getKeyIdHeader(sign({}, SECRET, { keyid: 'key-1' }))).toBe('key-1')
	})

	test('throws when the kid header is missing', () => {
		expect(() => getKeyIdHeader(sign({}, SECRET))).toThrow(
			expect.objectContaining({
				constructor: AuthTokenError,
				code: 'INVALID_TOKEN',
				statusCode: 401,
				message: 'Key id header is missing'
			})
		)
	})
})
