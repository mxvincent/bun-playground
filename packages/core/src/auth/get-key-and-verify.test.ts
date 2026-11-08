import { describe, expect, test } from 'bun:test'
import { sign } from 'jsonwebtoken'
import type { JwksClient, SigningKey } from 'jwks-rsa'
import { AuthTokenError } from './errors'
import { getKeyAndVerify } from './jwt'

const KEYS = { 'key-1': 'secret-1', 'key-2': 'secret-2' } as const

const signingKey = (kid: keyof typeof KEYS) => ({ kid, getPublicKey: () => KEYS[kid] }) as SigningKey

const jwks = {
	getSigningKey: async (kid: keyof typeof KEYS) => signingKey(kid),
	getSigningKeys: async () => [signingKey('key-1'), signingKey('key-2')]
} as unknown as JwksClient

const verify = (token: string) => getKeyAndVerify(token, jwks, { algorithms: ['HS256'] })

describe('getKeyAndVerify()', () => {
	test('verifies the token with the key named by its kid header', async () => {
		const token = sign({ key: 'value' }, KEYS['key-2'], { keyid: 'key-2' })
		await expect(verify(token)).resolves.toMatchObject({ key: 'value' })
	})

	test('tries every key when the token has no kid header', async () => {
		const token = sign({ key: 'value' }, KEYS['key-2'])
		await expect(verify(token)).resolves.toMatchObject({ key: 'value' })
	})

	test('rejects a token without kid header that no key verifies', async () => {
		const token = sign({ key: 'value' }, 'unknown-secret')
		await expect(verify(token)).rejects.toThrow(new AuthTokenError('Token invalid'))
	})
})
