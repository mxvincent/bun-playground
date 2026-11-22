import { describe, expect, test } from 'bun:test'
import { AuthTokenError } from './auth-token'

describe('AuthTokenError', () => {
	test('serializes the BaseError shape with the details', () => {
		expect(new AuthTokenError('Token invalid', { reason: 'jwt malformed' }).toJSON()).toEqual({
			statusCode: 401,
			message: 'Token invalid',
			code: 'INVALID_TOKEN',
			details: { reason: 'jwt malformed' }
		})
	})
})
