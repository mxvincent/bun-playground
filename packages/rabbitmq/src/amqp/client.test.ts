import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { AmqpConnectionManagerClass } from 'amqp-connection-manager'
import amqplib from 'amqplib'
import { config } from '#test-helpers/config'
import { AmqpClient } from './client'

const mockAmqpConnect = spyOn(amqplib, 'connect').mockImplementation(() => Promise.resolve({} as never))

afterEach(async () => {
	mockAmqpConnect.mockClear()
})

describe.skip('RabbiMQClient.initialize()', () => {
	test.skip('should call amqplib connect', async () => {
		const client = new AmqpClient(config)
		await client.initialize()
		expect(mockAmqpConnect).toHaveBeenCalledWith(`amqp://mxvincent:mxvincent@rabbitmq.tld:5672/mxvincent?heartbeat=5`, {
			timeout: 60000
		})
	})

	test('should fail when rabbitmq server is unreachable', async () => {
		mockAmqpConnect.mockRejectedValueOnce(new Error('RabbitMQ server is unreachable.'))
		await expect(AmqpClient.initialize(config)).rejects.toStrictEqual(new Error('RabbitMQ server is unreachable.'))
	})

	test('should create connection manager', async () => {
		const client = await AmqpClient.initialize(config)
		expect(client.getConnectionManager()).toBeInstanceOf(AmqpConnectionManagerClass)
	})

	test('should create default channel', async () => {
		const client = await AmqpClient.initialize(config)
		expect(client.getDefaultChannel()?.constructor.name).toBe('ChannelWrapper')
	})
})

describe('RabbiMQClient.publish()', () => {
	test('should publish with default channel', async () => {
		const defaultChannelPublishSpy = mock()

		const client = new AmqpClient(config)
		const defaultChannelSpy = spyOn(client, 'getDefaultChannel').mockReturnValue({
			publish: defaultChannelPublishSpy
		} as never)

		await client.publish('message', {
			destination: {
				type: 'topic',
				name: 'exchange',
				routingKey: 'routing-key'
			}
		})

		expect(defaultChannelPublishSpy).toHaveBeenCalledTimes(1)
		expect(defaultChannelPublishSpy).toHaveBeenCalledWith('exchange', 'routing-key', 'message')

		defaultChannelSpy.mockRestore()
	})

	test('should publish with a custom channel', async () => {
		const mockChannel = { publish: mock() }
		const client = new AmqpClient(config)
		await client.publish('message', {
			channel: mockChannel as never,
			destination: {
				type: 'topic',
				name: 'exchange',
				routingKey: 'routing-key'
			}
		})
		expect(mockChannel.publish).toHaveBeenCalledTimes(1)
		expect(mockChannel.publish).toHaveBeenCalledWith('exchange', 'routing-key', 'message')
	})
})
