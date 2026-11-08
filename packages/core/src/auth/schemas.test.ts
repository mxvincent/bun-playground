import { expect, test } from 'bun:test'
import { ASYMMETRIC_ALGORITHMS, SYMMETRIC_ALGORITHMS } from './schemas'

test('ASYMMETRIC_ALGORITHMS lists the RSA, ECDSA and RSA-PSS algorithms', () => {
	expect<string[]>(ASYMMETRIC_ALGORITHMS).toStrictEqual([
		'RS256',
		'RS384',
		'RS512',
		'ES256',
		'ES384',
		'ES512',
		'PS256',
		'PS384',
		'PS512'
	])
})

test('SYMMETRIC_ALGORITHMS lists the HMAC algorithms', () => {
	expect<string[]>(SYMMETRIC_ALGORITHMS).toStrictEqual(['HS256', 'HS384', 'HS512'])
})
