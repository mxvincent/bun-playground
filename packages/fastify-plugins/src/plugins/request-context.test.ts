import { afterAll, beforeAll, expect, it } from 'bun:test'
import Fastify from 'fastify'
import { fastifyRequestContext, requestContext } from './request-context'

const app = Fastify()

beforeAll(async () => {
	await app.register(fastifyRequestContext)
	app.get('/organizations/:id', async () => requestContext.getStore()?.request)
	await app.ready()
})

afterAll(async () => {
	await app.close()
})

it('exposes the request in the context of the handler', async () => {
	const response = await app.inject({ url: '/organizations/1' })
	expect(response.json<unknown>()).toMatchObject({ method: 'GET', path: '/organizations/:id', params: { id: '1' } })
})

it('returns the request id in the x-request-id header', async () => {
	const response = await app.inject({ url: '/organizations/1' })
	expect(response.headers['x-request-id']).toBe(response.json().id)
})
