import type { TObject } from '@package/json-schema'
import { logger, serializers } from '@package/telemetry'
import type { AmqpConnectionManager, Channel, ChannelWrapper } from 'amqp-connection-manager'
import { connect } from 'amqp-connection-manager'
import { getAmqpConnectionUrl } from '../config'
import type { AmqpConfig } from '../schemas/config'
import type { AmqpPublishOptions } from '../types'
import { Consumer, type ConsumerOptions } from './consumer'

const withMessagePrefix = (message: string) => `[AMQP] ${message}`

export class AmqpClient {
	readonly config: AmqpConfig
	#defaultChannel: ChannelWrapper | undefined
	#connectionManager: AmqpConnectionManager | undefined

	constructor(config: AmqpConfig) {
		this.config = config
	}

	static async initialize(config: AmqpConfig): Promise<AmqpClient> {
		const client = new AmqpClient(config)
		await client.initialize()
		return client
	}

	async teardown(): Promise<void> {
		return this.getConnectionManager().close()
	}

	createChannel(options: { name?: string; setup?: (channel: Channel) => Promise<void> }): ChannelWrapper {
		const channel = this.getConnectionManager().createChannel({
			name: options.name,
			confirm: true,
			setup: options.setup
		})
		channel.on('connect', () => {
			logger.info({ channel: channel.name }, '[RabbitMQ] Channel connected.')
		})
		channel.on('close', () => {
			logger.info({ channel: channel.name }, '[RabbitMQ] Channel closed.')
		})
		channel.on('error', (error) => {
			logger.error(
				{ channel: channel.name, reason: error.message, stack: error.stack },
				'[RabbitMQ] Channel encounter an error.'
			)
		})
		return channel
	}

	async initialize(): Promise<void> {
		if (!this.#defaultChannel) {
			const connectionManager = connect([getAmqpConnectionUrl(this.config)], {
				connectionOptions: {
					timeout: this.config.connection.timeoutInSeconds * 1000
				}
			})
			connectionManager.on('connect', () => {
				logger.info('[RabbitMQ] Connection established.')
			})
			connectionManager.on('connectFailed', ({ err: error }) => {
				logger.warn({ error }, '[RabbitMQ] Connection failed.')
			})
			connectionManager.on('blocked', ({ reason }) => {
				logger.warn({ reason }, '[RabbitMQ] Connection blocked.')
			})
			connectionManager.on('unblocked', () => {
				logger.warn('[RabbitMQ] Connection unblocked.')
			})
			connectionManager.on('disconnect', ({ err }) => {
				logger.warn({ reason: serializers.error(err) }, '[RabbitMQ] Connection closed.')
			})
			this.#connectionManager = connectionManager
			this.#defaultChannel = this.createChannel({
				name: 'default-publish-channel'
			})
		}
		return this.#defaultChannel.waitForConnect()
	}

	async publish(message: Buffer, options: AmqpPublishOptions): Promise<void>

	async publish(message: string, options: AmqpPublishOptions): Promise<void>

	async publish(message: Buffer | string, options: AmqpPublishOptions): Promise<void> {
		const channel = options.channel ?? this.getDefaultChannel()
		if (options.destination.type === 'topic') {
			await channel.publish(options.destination.name, options.destination.routingKey, message)
		} else {
			await channel.sendToQueue(options.destination.name, message)
		}
		logger.info({ options }, '[AMQP] Message published.')
	}

	async consume<Schema extends TObject>(options: ConsumerOptions<Schema>): Promise<Consumer<Schema>> {
		const consumer = new Consumer(this, options)
		await consumer.start()
		return consumer
	}

	getConnectionManager(): AmqpConnectionManager {
		if (!this.#connectionManager) {
			throw new Error(withMessagePrefix('Connection manager is not initialized yet.'))
		}
		return this.#connectionManager
	}

	getDefaultChannel(): ChannelWrapper {
		if (!this.#defaultChannel) {
			throw new Error(withMessagePrefix('Client is not initialized yet.'))
		}
		return this.#defaultChannel
	}
}
