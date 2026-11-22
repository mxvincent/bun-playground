import { afterAll, afterEach, beforeAll, describe, expect, it, test } from 'bun:test'
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
const encodedVhost = encodeURIComponent(config.connection.vhost)

describe('RabbitMQManagementApi.listQueues()', () => {
	afterEach(() => {
		managementApiServer.resetHandlers()
	})

	test('throws when the queues are not listed', async () => {
		managementApiServer.use(http.get('https://localhost/api/queues/:vhost', () => new Response(null, { status: 503 })))
		await expect(api.listQueues()).rejects.toThrow(
			expect.objectContaining({
				constructor: RabbitMQManagementAPIError,
				message: '[RabbitMQ] List queues query failed.',
				requestUrl: `https://localhost/api/queues/${encodedVhost}`,
				responseStatus: 503
			})
		)
	})
})

describe('RabbitMQManagementApi.getQueueBindings()', () => {
	afterEach(() => {
		managementApiServer.resetHandlers()
	})

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
	test('throws when the bindings are not listed', async () => {
		managementApiServer.use(
			http.get('https://localhost/api/queues/:vhost/:queue/bindings', () => new Response(null, { status: 404 }))
		)
		await expect(api.listQueueBindings('test-queue')).rejects.toThrow(
			expect.objectContaining({
				constructor: RabbitMQManagementAPIError,
				message: '[RabbitMQ] List queue bindings query failed.',
				requestUrl: `https://localhost/api/queues/${encodedVhost}/test-queue/bindings`,
				responseStatus: 404
			})
		)
	})
})

describe('shovels', () => {
	afterEach(() => {
		managementApiServer.resetHandlers()
	})

	// putShovel() draws the shovel id itself: the handler records it to build the expected URL
	let createdShovelId: unknown
	const respondToShovels = (status: number) =>
		managementApiServer.use(
			http.put('https://localhost/api/parameters/shovel/:vhost/:id', ({ params }) => {
				createdShovelId = params.id
				return new Response(null, { status })
			}),
			http.delete('https://localhost/api/parameters/shovel/:vhost/:id', () => new Response(null, { status }))
		)

	test('listShovels() throws when the shovels are not listed', async () => {
		managementApiServer.use(
			http.get('https://localhost/api/parameters/shovel/:vhost', () => new Response(null, { status: 500 }))
		)
		await expect(api.listShovels()).rejects.toThrow(
			expect.objectContaining({
				constructor: RabbitMQManagementAPIError,
				message: '[RabbitMQ] List shovels query failed.',
				requestUrl: `https://localhost/api/parameters/shovel/${encodedVhost}`,
				responseStatus: 500
			})
		)
	})

	it('putShovel() returns the created shovel', async () => {
		respondToShovels(201)
		const shovel = await api.putShovel({ sourceQueue: 'source', destinationQueue: 'destination' })
		expect(shovel.value).toMatchObject({ 'src-queue': 'source', 'dest-queue': 'destination' })
	})

	it('putShovel() throws when the shovel is not created', async () => {
		respondToShovels(400)
		const creating = api.putShovel({ sourceQueue: 'source', destinationQueue: 'destination' })
		// The expected URL holds the id, known once the request is sent: let the call settle first
		await creating.catch(() => undefined)
		await expect(creating).rejects.toThrow(
			expect.objectContaining({
				constructor: RabbitMQManagementAPIError,
				message: '[RabbitMQ] Create shovel query failed.',
				requestUrl: `https://localhost/api/parameters/shovel/${encodedVhost}/${createdShovelId}`,
				responseStatus: 400
			})
		)
	})

	it('deleteShovel() throws when the shovel is not deleted', async () => {
		respondToShovels(404)
		await expect(api.deleteShovel('id')).rejects.toThrow(
			expect.objectContaining({
				constructor: RabbitMQManagementAPIError,
				message: '[RabbitMQ] Delete shovel query failed.',
				requestUrl: `https://localhost/api/parameters/shovel/${encodedVhost}/id`,
				responseStatus: 404
			})
		)
	})
})

describe('RabbitMQManagementApi.getQueue()', () => {
	afterEach(() => {
		managementApiServer.resetHandlers()
	})

	it('throws on a status other than 200 and 404', async () => {
		managementApiServer.use(
			http.get('https://localhost/api/queues/:vhost/:queue', () => new Response(null, { status: 500 }))
		)
		await expect(api.getQueue('orders')).rejects.toThrow(
			expect.objectContaining({
				constructor: RabbitMQManagementAPIError,
				message: `Unexpected response status 500 for https://localhost/api/queues/${encodedVhost}/orders.`,
				requestUrl: `https://localhost/api/queues/${encodedVhost}/orders`,
				responseStatus: 500
			})
		)
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
