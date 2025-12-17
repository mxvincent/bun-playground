import { wait } from '@package/core'
import { logger } from '@package/telemetry'
import type { Channel, ChannelWrapper } from 'amqp-connection-manager'
import assert from 'assert'
import type { AmqpClient } from '../amqp/client'
import { AmqpQueue, QueueRole, QueueType } from '../types/queue'
import type { ExchangeConfig, TopicBinding } from '../types/topic'

import { RabbitMQManagementAPI } from './api'

export type ChannelOption = ChannelWrapper | Channel

const getTmpQueueConfig = (queue: AmqpQueue): AmqpQueue => {
	return new AmqpQueue({
		name: `tmp.${queue.name}`,
		role: QueueRole.SHOVEL,
		type: QueueType.QUORUM,
		bindings: queue.bindings
	})
}

const isEqualToAmqpBinding = (a: TopicBinding) => {
	return (b: TopicBinding) => a.exchange === b.exchange && a.routingKey === b.routingKey
}

export class RabbitMQManagementClient {
	private readonly api: RabbitMQManagementAPI
	private readonly amqp: AmqpClient

	constructor(amqp: AmqpClient) {
		this.amqp = amqp
		assert(amqp.config.managementApi, 'Management API should be configured.')
		this.api = new RabbitMQManagementAPI(amqp.config)
	}

	get channel() {
		return this.amqp.getDefaultChannel()
	}

	async diffQueueBindings(queue: Required<Pick<AmqpQueue, 'bindings' | 'name'>>): Promise<{
		added: TopicBinding[]
		removed: TopicBinding[]
	}> {
		const previousBindings = await this.api.listQueueBindings(queue.name)
		const expectedBindings = queue.bindings
		return {
			added: expectedBindings.filter((binding) => !previousBindings.find(isEqualToAmqpBinding(binding))),
			removed: previousBindings.filter((binding) => !expectedBindings.find(isEqualToAmqpBinding(binding)))
		}
	}

	async configureExchange(
		exchange: ExchangeConfig,
		channel: Channel | ChannelWrapper = this.amqp.getDefaultChannel()
	): Promise<void> {
		await channel.assertExchange(exchange.name, exchange.type)
		logger.info(
			{
				amqp: {
					exchange: exchange.name,
					type: exchange.type
				}
			},
			'[RabbitMQ] Exchange configured.'
		)
	}

	async deleteQueue(queue: AmqpQueue, options?: { channel?: ChannelOption }) {
		const channel = options?.channel ?? this.amqp.getDefaultChannel()
		await channel.deleteQueue(queue.name)
		logger.info(
			{
				amqp: {
					queue: queue.name,
					options: queue.options
				}
			},
			'[RabbitMQ] Queue deleted.'
		)
	}

	async configureQueue(expectedQueueConfig: AmqpQueue, options?: { channel?: Channel | ChannelWrapper }) {
		const channel = options?.channel ?? this.amqp.getDefaultChannel()

		// Get cluster queue config
		const declaredQueue = await this.api.getQueue(expectedQueueConfig.name)

		// Handle not existing queue case
		if (!declaredQueue) {
			await this.syncQueue(expectedQueueConfig, { channel })
			await this.syncQueueBindings(expectedQueueConfig, { channel })
			return
		}

		// Load previous queue config using
		const currentQueueBindings = await this.api.listQueueBindings(expectedQueueConfig.name)
		const currentQueueConfig = AmqpQueue.fromAmqpQueue(declaredQueue, currentQueueBindings)

		// Compare previous queue config with expected config to prevent useless configuration
		if (currentQueueConfig.argumentEquals(expectedQueueConfig)) {
			await this.syncQueueBindings(expectedQueueConfig, { channel })
		} else {
			logger.warn(
				{
					currentConfig: currentQueueConfig.options,
					expectedConfig: expectedQueueConfig.options
				},
				'[AMQP] Queue argument mismatch requires reconfiguration.'
			)

			// Create a temporary queue to handle messages during queue reconfiguration
			const tmpQueueConfig = getTmpQueueConfig(currentQueueConfig)
			await this.syncQueue(tmpQueueConfig, { channel })
			await this.syncQueueBindings(tmpQueueConfig, { channel })

			// Remove bindings from the previous queue
			for (const binding of currentQueueConfig.bindings) {
				await this.removeQueueBinding(currentQueueConfig.name, binding, {
					channel
				})
			}

			// Move messages from previous queue to the temporary queue and delete previous queue
			await this.moveMessages({
				sourceQueue: currentQueueConfig.name,
				destinationQueue: tmpQueueConfig.name
			})

			//  Delete previous queue
			await this.deleteQueue(currentQueueConfig, { channel })

			// Create queue with expected config
			await this.syncQueue(expectedQueueConfig, { channel })
			await this.syncQueueBindings(expectedQueueConfig, { channel })

			// Remove bindings from temporary queue
			for (const binding of tmpQueueConfig.bindings) {
				await this.removeQueueBinding(tmpQueueConfig.name, binding, {
					channel
				})
			}

			//  Move message from a temporary queue to the new queue
			await this.moveMessages({
				sourceQueue: tmpQueueConfig.name,
				destinationQueue: expectedQueueConfig.name
			})

			// Delete temporary queue
			await this.deleteQueue(tmpQueueConfig, { channel })
		}
		if (expectedQueueConfig.role === QueueRole.CONSUMER) {
			logger.info(
				{
					amqp: {
						queue: expectedQueueConfig.name,
						options: expectedQueueConfig.options
					}
				},
				'[RabbitMQ] Queue configured.'
			)
		}
	}

	private async syncQueue(queue: AmqpQueue, { channel }: { channel: ChannelOption }) {
		await channel.assertQueue(queue.name, queue.options)
		logger.debug(
			{
				amqp: { queue: queue.name, options: queue.options }
			},
			'[RabbitMQ] Queue synced.'
		)
	}

	private async syncQueueBindings(queue: AmqpQueue, { channel }: { channel: ChannelOption }) {
		const { added, removed } = await this.diffQueueBindings(queue)
		for (const binding of added) {
			await this.addQueueBinding(queue.name, binding, { channel })
		}
		for (const binding of removed) {
			await this.removeQueueBinding(queue.name, binding, { channel })
		}
		logger.debug({ queue: queue.name, added, removed }, '[RabbitMQ] Queue bindings synced.')
	}

	private async addQueueBinding(queue: string, binding: TopicBinding, options: { channel: ChannelOption }) {
		await options.channel.bindQueue(queue, binding.exchange, binding.routingKey)
		logger.trace(
			{
				amqp: { queue, binding }
			},
			'[RabbitMQ] Queue binding added.'
		)
	}

	private async removeQueueBinding(queue: string, binding: TopicBinding, { channel }: { channel: ChannelOption }) {
		await channel.unbindQueue(queue, binding.exchange, binding.routingKey)
		logger.trace(
			{
				amqp: { queue, binding }
			},
			'[RabbitMQ] Queue binding removed.'
		)
	}

	private async moveMessages(options: { sourceQueue: string; destinationQueue: string }) {
		await this.api.putShovel(options)
		const getSourceQueueMessageCount = async (): Promise<number> => {
			const { messages } = await this.api.getQueueOrFail(options.sourceQueue)
			if (messages) {
				logger.info(options, `[RabbitMQ] Remaining ${messages} messages to move.`)
			}
			return messages
		}
		while ((await getSourceQueueMessageCount()) > 0) {
			await wait(1000)
		}
		logger.info(options, `[RabbitMQ] All message moved.`)
	}
}
