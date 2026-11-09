import { afterAll, beforeAll, expect, it } from 'bun:test'
import { ResourceNotFoundError } from '@package/errors'
import Fastify from 'fastify'
import { fastifyErrorHandler } from './error-handler'

const app = Fastify()

beforeAll(async () => {
	await app.register(fastifyErrorHandler)
	app.get('/missing', async () => {
		throw new ResourceNotFoundError('organization', 'id-1')
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
