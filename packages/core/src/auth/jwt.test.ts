import { describe, expect, test } from 'bun:test'
import { generateKeyPairSync, randomBytes } from 'crypto'
import { type SignOptions, sign, type VerifyOptions } from 'jsonwebtoken'
import { AuthTokenError } from './errors'
import { verifyToken } from './jwt'
import { JWTAlgorithm } from './types'

const SECRET = randomBytes(64).toString('hex')
const RSA_KEY_PAIR = generateKeyPairSync('rsa', {
	modulusLength: 4096,
	publicKeyEncoding: { type: 'spki', format: 'pem' },
	privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
})

const getSymmetricKeyTools = (
	algorithm: JWTAlgorithm
): {
	sign: (payload: object, options?: SignOptions) => string
	verify: (token: string) => Promise<Record<string, unknown>>
} => {
	const verifyOptions = {
		algorithms: [algorithm],
		audience: 'https://valid.com',
		issuer: 'https://valid.com'
	} satisfies VerifyOptions
	const signOptions = {
		algorithm,
		audience: 'https://valid.com',
		issuer: 'https://valid.com',
		expiresIn: '1h',
		notBefore: '0'
	} satisfies SignOptions
	switch (algorithm) {
		case JWTAlgorithm.HS256:
		case JWTAlgorithm.HS384:
		case JWTAlgorithm.HS512:
			return {
				sign(payload, options) {
					return sign(payload, SECRET, { ...signOptions, ...options })
				},
				verify(token) {
					return verifyToken(token, SECRET, verifyOptions)
				}
			}
		case JWTAlgorithm.RS256:
		case JWTAlgorithm.RS384:
		case JWTAlgorithm.RS512:
			return {
				sign(payload, options) {
					return sign(payload, RSA_KEY_PAIR.privateKey, {
						...signOptions,
						...options
					})
				},
				verify(token) {
					return verifyToken(token, RSA_KEY_PAIR.publicKey, verifyOptions)
				}
			}
		default:
			throw new Error(`Missing certificates for ${algorithm}`)
	}
}

describe.each([
	JWTAlgorithm.HS256,
	JWTAlgorithm.HS384,
	JWTAlgorithm.HS512,
	JWTAlgorithm.RS256,
	JWTAlgorithm.RS384,
	JWTAlgorithm.RS512
])(`verify token using %s algorithm`, (algorithm) => {
	const { sign, verify } = getSymmetricKeyTools(algorithm)
	const payload = {
		key: 'value'
	}

	test('should succeed to verify token', async () => {
		const token = sign(payload)
		await expect(verify(token)).resolves.toMatchObject(payload)
	})

	test(`should reject token when audience is not valid`, async () => {
		const token = sign(payload, { audience: 'https://not.valid.com' })
		await expect(verify(token)).rejects.toThrow(new AuthTokenError(`Token invalid`))
	})

	test(`should reject token when issuer is not valid`, async () => {
		const token = sign(payload, { issuer: 'https://not.valid.com' })
		await expect(verify(token)).rejects.toThrow(new AuthTokenError(`Token invalid`))
	})

	test('should reject expired token', async () => {
		const token = sign(payload, { expiresIn: '-1h' })
		await expect(verify(token)).rejects.toThrow(new AuthTokenError(`This token is expired`))
	})

	test('should reject not enabled token', async () => {
		const token = sign(payload, { notBefore: '1h', expiresIn: '2h' })
		await expect(verify(token)).rejects.toThrow(new AuthTokenError(`This token cannot yet be used`))
	})
})
