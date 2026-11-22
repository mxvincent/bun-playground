import { afterAll, beforeAll, beforeEach, describe, expect, it, spyOn, test } from 'bun:test'
import { BaseError, ResourceNotFoundError } from '@package/errors'
import Fastify from 'fastify'
import { fastifyErrorHandler } from './error-handler'

const UPSTREAM_URL = 'http://10.0.0.12/internal/users'

/** A typed server error whose context must stay internal: 500 by default, like BaseError */
class UpstreamUnavailableError extends BaseError {
	code = 'TEST_UPSTREAM_UNAVAILABLE'
	readonly url: string

	constructor(url: string) {
		super(`Upstream is unavailable (url=${url})`)
		this.url = url
	}

	override toJSON() {
		return { ...super.toJSON(), url: this.url }
	}
}

/** The same server error with another 5xx status code */
class UpstreamTimeoutError extends UpstreamUnavailableError {
	override statusCode = 503
}

const app = Fastify()

beforeAll(async () => {
	await app.register(fastifyErrorHandler)
	app.get('/missing', async () => {
		throw new ResourceNotFoundError('organization', 'id-1')
	})
	app.get('/unavailable', async () => {
		throw new UpstreamUnavailableError(UPSTREAM_URL)
	})
	app.get('/unavailable-503', async () => {
		throw new UpstreamTimeoutError(UPSTREAM_URL)
	})
	app.get('/internal', async () => {
		throw new Error('connection to 10.0.0.12 refused')
	})
	app.get('/upstream', async () => {
		throw Object.assign(new Error('GET http://10.0.0.12/internal/users 404'), { statusCode: 404 })
	})
	app.post('/validated', { schema: { body: { type: 'object', required: ['name'] } } }, async () => 'ok')
	await app.ready()
})

afterAll(async () => {
	await app.close()
})

it('responds to a BaseError with its status code and its JSON body', async () => {
	const response = await app.inject({ url: '/missing' })
	expect({ statusCode: response.statusCode, body: response.json() }).toStrictEqual({
		statusCode: 404,
		body: new ResourceNotFoundError('organization', 'id-1').toJSON()
	})
})

test.each<{ url: string; statusCode: number }>([
	{ url: '/unavailable', statusCode: 500 },
	{ url: '/unavailable-503', statusCode: 503 }
])('responds to a BaseError with a $statusCode status code with its code and a generic message, without its context', async ({
	url,
	statusCode
}) => {
	const response = await app.inject({ url })
	expect({ statusCode: response.statusCode, body: response.json<unknown>() }).toStrictEqual({
		statusCode,
		body: { statusCode, code: 'TEST_UPSTREAM_UNAVAILABLE', message: 'Internal server error' }
	})
})

it('responds to an unexpected error with a generic 500, without its message', async () => {
	const response = await app.inject({ url: '/internal' })
	expect({ statusCode: response.statusCode, body: response.json<unknown>() }).toStrictEqual({
		statusCode: 500,
		body: { statusCode: 500, message: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' }
	})
})

it('responds to an error with a status code that Fastify did not produce with a generic 500', async () => {
	const response = await app.inject({ url: '/upstream' })
	expect({ statusCode: response.statusCode, body: response.json<unknown>() }).toStrictEqual({
		statusCode: 500,
		body: { statusCode: 500, message: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' }
	})
})

it('keeps the response of a Fastify client error', async () => {
	const response = await app.inject({ method: 'POST', url: '/validated', payload: {} })
	expect({ statusCode: response.statusCode, code: response.json<{ code: string }>().code }).toStrictEqual({
		statusCode: 400,
		code: 'FST_ERR_VALIDATION'
	})
})

describe('logs', () => {
	const errorLogSpy = spyOn(app.log, 'error')
	const consoleLogSpy = spyOn(console, 'log')

	beforeEach(() => {
		errorLogSpy.mockClear()
		consoleLogSpy.mockClear()
	})

	afterAll(() => {
		errorLogSpy.mockRestore()
		consoleLogSpy.mockRestore()
	})

	it('logs an unexpected error as an error', async () => {
		await app.inject({ url: '/internal' })
		expect(errorLogSpy).toHaveBeenCalledWith(expect.anything(), 'Unhandled error')
	})

	test('logs a BaseError with a 5xx status code as an error, with its context', async () => {
		await app.inject({ url: '/unavailable' })
		expect(errorLogSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expect.objectContaining({ constructor: UpstreamUnavailableError, url: UPSTREAM_URL })
			}),
			'Unhandled error'
		)
	})

	it('logs an error with a 4xx status code that Fastify did not produce as an error', async () => {
		await app.inject({ url: '/upstream' })
		expect(errorLogSpy).toHaveBeenCalledWith(expect.anything(), 'Unhandled error')
	})

	it('does not log an expected 4xx error as an error', async () => {
		await app.inject({ url: '/missing' })
		expect(errorLogSpy).not.toHaveBeenCalled()
	})

	it('does not print errors on the console', async () => {
		await app.inject({ url: '/missing' })
		expect(consoleLogSpy).not.toHaveBeenCalled()
	})
})
