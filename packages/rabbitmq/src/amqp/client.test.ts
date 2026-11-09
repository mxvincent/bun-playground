import { afterAll, beforeAll, describe, expect, mock, test } from 'bun:test'
import { randomUUID } from 'node:crypto'
import { config } from '#test-helpers/config'
import { createMeasureMessageContent, type MeasureMessage, MeasureMessageSchema } from '#test-helpers/message'
import { AmqpClient } from './client'
import type { Consumer } from './consumer'

describe('AmqpClient before initialize()', () => {
	test('getDefaultChannel() throws', () => {
		expect(() => new AmqpClient(config).getDefaultChannel()).toThrow('Client is not initialized yet.')
	})

	test('getConnectionManager() throws', () => {
		expect(() => new AmqpClient(config).getConnectionManager()).toThrow('Connection manager is not initialized yet.')
	})
})

describe('AmqpClient.publish()', () => {
	test('publishes to a topic with the exchange and the routing key', async () => {
		const channel = { publish: mock(() => Promise.resolve()), sendToQueue: mock(() => Promise.resolve()) }
		await new AmqpClient(config).publish('message', {
			channel: channel as never,
			destination: { type: 'topic', name: 'exchange', routingKey: 'routing-key' }
		})
		expect(channel.publish).toHaveBeenCalledWith('exchange', 'routing-key', 'message')
	})

	test('sends to a queue by its name', async () => {
		const channel = { publish: mock(() => Promise.resolve()), sendToQueue: mock(() => Promise.resolve()) }
		await new AmqpClient(config).publish('message', {
			channel: channel as never,
			destination: { type: 'queue', name: 'queue' }
		})
		expect(channel.sendToQueue).toHaveBeenCalledWith('queue', 'message')
	})
})

// Against the RabbitMQ of the test environment (local docker, CI service)
describe('AmqpClient with a broker', () => {
	const queue = `test.amqp-client.${randomUUID()}`
	// Assigned before initialize() so that afterAll() closes its connection manager when the broker is unreachable
	const client = new AmqpClient(config)
	let isQueueAsserted = false
	const consumers: Consumer<typeof MeasureMessageSchema>[] = []

	beforeAll(async () => {
		await client.initialize()
		await client.getDefaultChannel().assertQueue(queue)
		isQueueAsserted = true
	})

	afterAll(async () => {
		// Stop the consumers first: deleting a consumed queue closes their channel
		await Promise.all(consumers.map((consumer) => consumer.stop()))
		if (isQueueAsserted) {
			await client.getDefaultChannel().deleteQueue(queue)
		}
		await client.teardown()
	})

	test('initialize() connects the default channel', () => {
		expect(client.getDefaultChannel().name).toBe('default-publish-channel')
	})

	test('a consumer receives the validated content of a published message', async () => {
		const content = createMeasureMessageContent()
		const received = new Promise<MeasureMessage>((resolve) => {
			const consumer = client.consume({
				queue,
				schema: MeasureMessageSchema,
				handler: async (message) => resolve(message),
				concurrency: 1,
				retryAttempts: 0,
				keepUnprocessableMessages: false,
				logMessageContent: false
			})
			consumer.then((started) => consumers.push(started))
		})

		await client.publish(JSON.stringify(content), { destination: { type: 'queue', name: queue } })

		expect(await received).toStrictEqual(content)
	})
})
