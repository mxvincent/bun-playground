import { describe, expect, test } from 'bun:test'
import { AuthError } from './auth'
import { AuthJWKSError } from './auth-jwks'

const MESSAGE = 'Signing key set cannot be read'
const DETAILS = { kid: 'key-1' }

describe('AuthJWKSError', () => {
	test('is an AuthError', () => {
		expect(new AuthJWKSError(MESSAGE)).toBeInstanceOf(AuthError)
	})

	test('has its own code AUTH_JWKS_ERROR, status 500 and the details', () => {
		expect(new AuthJWKSError(MESSAGE, DETAILS)).toEqual(
			expect.objectContaining({
				constructor: AuthJWKSError,
				code: 'AUTH_JWKS_ERROR',
				statusCode: 500,
				message: MESSAGE,
				details: DETAILS
			})
		)
	})

	test('serializes the BaseError shape with the details', () => {
		expect(new AuthJWKSError(MESSAGE, DETAILS).toJSON()).toEqual({
			statusCode: 500,
			message: MESSAGE,
			code: 'AUTH_JWKS_ERROR',
			details: DETAILS
		})
	})
})
