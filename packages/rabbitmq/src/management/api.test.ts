import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test'
import { http } from 'msw'
import { config } from '#test-helpers/config'
import { managementApiServer } from '#test-helpers/management-api'

import { RabbitMQManagementAPIError } from '../errors/rabbitmq-management-api-error'
import { RabbitMQManagementAPI } from './api'

beforeAll(() => {
	managementApiServer.listen()
})

afterAll(() => {
	managementApiServer.close()
})

const api = new RabbitMQManagementAPI(config)

describe('RabbitMQManagementApi.getQueueBindings()', () => {
	it('should map RabbitMQ management API response', async () => {
		const bindings = await api.listQueueBindings('test-queue')
		expect(bindings[0]).toEqual(
			expect.objectContaining({
				exchange: expect.any(String),
				routingKey: expect.any(String)
			})
		)
	})
	it('should hide rabbitmq system bindings', async () => {
		const bindings = await api.listQueueBindings('test-queue')
		expect(bindings).toEqual([
			{ exchange: 'loan', routingKey: 'loan.created' },
			{ exchange: 'loan', routingKey: 'loan.updated' }
		])
	})
})

describe('shovels', () => {
	afterEach(() => {
		managementApiServer.resetHandlers()
	})

	const respondToShovels = (status: number) =>
		managementApiServer.use(
			http.put('https://localhost/api/parameters/shovel/:vhost/:id', () => new Response(null, { status })),
			http.delete('https://localhost/api/parameters/shovel/:vhost/:id', () => new Response(null, { status }))
		)

	it('putShovel() returns the created shovel', async () => {
		respondToShovels(201)
		const shovel = await api.putShovel({ sourceQueue: 'source', destinationQueue: 'destination' })
		expect(shovel.value).toMatchObject({ 'src-queue': 'source', 'dest-queue': 'destination' })
	})

	it('putShovel() throws when the shovel is not created', async () => {
		respondToShovels(400)
		await expect(api.putShovel({ sourceQueue: 'source', destinationQueue: 'destination' })).rejects.toThrow(
			RabbitMQManagementAPIError
		)
	})

	it('deleteShovel() throws when the shovel is not deleted', async () => {
		respondToShovels(404)
		await expect(api.deleteShovel('id')).rejects.toThrow(RabbitMQManagementAPIError)
	})
})

describe('queue names in URLs', () => {
	afterEach(() => {
		managementApiServer.resetHandlers()
	})

	// A name holding URL separators must reach the API as a single path segment
	const name = 'orders/eu#1?x=%'

	it('getQueue() encodes the queue name', async () => {
		let requestedName: unknown
		managementApiServer.use(
			http.get('https://localhost/api/queues/:vhost/:queue', ({ params }) => {
				requestedName = params.queue
				return new Response(null, { status: 404 })
			})
		)
		await api.getQueue(name)
		expect(requestedName).toBe(name)
	})

	it('listQueueBindings() encodes the queue name', async () => {
		let requestedName: unknown
		managementApiServer.use(
			http.get('https://localhost/api/queues/:vhost/:queue/bindings', ({ params }) => {
				requestedName = params.queue
				return new Response(JSON.stringify([]), { status: 200 })
			})
		)
		await api.listQueueBindings(name)
		expect(requestedName).toBe(name)
	})
})
