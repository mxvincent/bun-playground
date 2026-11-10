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
