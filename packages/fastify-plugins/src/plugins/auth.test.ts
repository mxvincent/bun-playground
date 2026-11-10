import { afterAll, beforeAll, expect, it } from 'bun:test'
import Fastify from 'fastify'
import { fastifyAuth } from './auth'

const app = Fastify()

beforeAll(async () => {
	await app.register(fastifyAuth)
	app.get('/actor', async (request) => ({ actor: request.actor }))
	await app.ready()
})

afterAll(async () => {
	await app.close()
})

it('treats a request without authentication as anonymous', async () => {
	expect((await app.inject({ url: '/actor' })).json<unknown>()).toStrictEqual({ actor: null })
})
