import { describe, expect, test } from 'bun:test'
import { AuthorizationError } from '@package/errors'
import { AuthError } from './auth'

const MESSAGE = 'Authentication failed'
const DETAILS = { scheme: 'Bearer' }

describe('AuthError', () => {
	test('is an AuthorizationError, so a BaseError', () => {
		expect(new AuthError(MESSAGE)).toBeInstanceOf(AuthorizationError)
	})

	test('has code AUTH_ERROR, status 401 and the details', () => {
		expect(new AuthError(MESSAGE, DETAILS)).toEqual(
			expect.objectContaining({
				constructor: AuthError,
				code: 'AUTH_ERROR',
				statusCode: 401,
				message: MESSAGE,
				details: DETAILS
			})
		)
	})

	test('serializes the BaseError shape with the details', () => {
		expect(new AuthError(MESSAGE, DETAILS).toJSON()).toEqual({
			statusCode: 401,
			message: MESSAGE,
			code: 'AUTH_ERROR',
			details: DETAILS
		})
	})
})
