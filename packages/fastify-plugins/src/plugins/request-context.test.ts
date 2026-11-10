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

it('reads the actor set by a hook registered after the context plugin', async () => {
	const authenticatedApp = Fastify()
	await authenticatedApp.register(fastifyRequestContext)
	authenticatedApp.decorateRequest('actor', null)
	authenticatedApp.addHook('onRequest', async (request) => {
		request.actor = { type: 'service', id: 'billing' }
	})
	authenticatedApp.get('/actor', async () => ({ actor: requestContext.getStore()?.actor }))
	const response = await authenticatedApp.inject({ url: '/actor' })
	await authenticatedApp.close()
	expect(response.json<unknown>()).toStrictEqual({ actor: { type: 'service', id: 'billing' } })
})
