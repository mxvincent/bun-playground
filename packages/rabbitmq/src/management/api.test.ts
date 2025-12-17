import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { config } from '#test-helpers/config'
import { managementApiServer } from '#test-helpers/management-api'

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
