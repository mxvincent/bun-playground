import { afterAll, beforeAll, expect, it } from 'bun:test'
import Fastify from 'fastify'
import { fastifyResponseTime } from './response-time'

const app = Fastify()

beforeAll(async () => {
	await app.register(fastifyResponseTime)
	app.get('/', async () => 'ok')
	await app.ready()
})

afterAll(async () => {
	await app.close()
})

it('returns the response time in the x-response-time header', async () => {
	const response = await app.inject({ url: '/' })
	expect(Number(response.headers['x-response-time'])).toBeGreaterThanOrEqual(0)
})
