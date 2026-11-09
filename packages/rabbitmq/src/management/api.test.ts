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
