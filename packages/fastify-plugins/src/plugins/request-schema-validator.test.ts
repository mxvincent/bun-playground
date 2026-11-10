import { afterAll, beforeAll, expect, it } from 'bun:test'
import { Type } from '@package/json-schema'
import Fastify from 'fastify'
import { fastifyRequestSchemaValidator } from './request-schema-validator'

const app = Fastify()
const schema = Type.Object({ count: Type.Integer() })

beforeAll(async () => {
	await app.register(fastifyRequestSchemaValidator)
	app.get('/query', { schema: { querystring: schema } }, async (request) => request.query)
	app.post('/body', { schema: { body: schema } }, async (request) => request.body)
	await app.ready()
})

afterAll(async () => {
	await app.close()
})

it('coerces the query string to the schema types', async () => {
	expect((await app.inject({ url: '/query?count=2' })).json<unknown>()).toStrictEqual({ count: 2 })
})

it('does not coerce the body', async () => {
	const response = await app.inject({ method: 'POST', url: '/body', payload: { count: '2' } })
	expect(response.statusCode).toBe(400)
})

it('accepts a body of the schema types', async () => {
	const response = await app.inject({ method: 'POST', url: '/body', payload: { count: 2 } })
	expect(response.json<unknown>()).toStrictEqual({ count: 2 })
})
