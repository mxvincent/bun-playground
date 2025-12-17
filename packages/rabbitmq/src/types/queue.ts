import { isNumber, isString } from '@package/core'
import type { Options } from 'amqplib'
import { isEqual } from 'es-toolkit'
import { getRetryAttemptDelayInMilliseconds, getRetryAttemptRoutingKey, RETRY_EXCHANGE } from '../amqp/retry'
import { AmqpConfigError } from '../errors/amqp-config-error'
import type { ManagementApiQueue } from '../management/types'
import type { TopicBinding } from './topic'

export const RETRY_FAILURE_MESSAGE_TTL_IN_MILLISECONDS = 86400000 * 7 // 7 days
export const UNPROCESSABLE_MESSAGE_TTL_IN_MILLISECONDS = 86400000 * 7 // 7 days

export enum QueueType {
	CLASSIC = 'classic',
	QUORUM = 'quorum'
}

export enum QueueRole {
	CONSUMER = 'consumer',
	SHOVEL = 'shovel',
	RETRY_ATTEMPT = 'retry-attempt',
	RETRY_FAILURE = 'retry-failure',
	UNPROCESSABLE = 'unprocessable'
}

export type AmqpQueueArguments = {
	'x-dead-letter-exchange': string
	'x-dead-letter-routing-key': string
	'x-message-ttl': number
	'x-queue-type': QueueType
}

/**
 * Amqp queue configuration
 */
export class AmqpQueue {
	readonly name: string
	readonly type: QueueType
	readonly role: QueueRole
	readonly options: Options.AssertQueue
	readonly bindings: TopicBinding[]

	constructor(values: Required<Pick<AmqpQueue, 'name'>> & Partial<AmqpQueue>) {
		this.name = values.name
		this.type = values.type ?? QueueType.QUORUM
		this.role = values.role ?? QueueRole.CONSUMER
		this.bindings = values.bindings ?? []
		this.options = values.options ?? {}
		this.options.arguments = Object.assign(this.options.arguments ?? {}, {
			'x-queue-type': this.type
		})
	}

	static fromAmqpQueue(queue: ManagementApiQueue, bindings: TopicBinding[]): AmqpQueue {
		const options: AmqpQueue['options'] = {}
		if (isString(queue.arguments['x-dead-letter-exchange'])) {
			options.deadLetterExchange = queue.arguments['x-dead-letter-exchange']
		}
		if (isString(queue.arguments['x-dead-letter-routing-key'])) {
			options.deadLetterRoutingKey = queue.arguments['x-dead-letter-routing-key']
		}
		if (isNumber(queue.arguments['x-message-ttl'])) {
			options.messageTtl = queue.arguments['x-message-ttl']
		}
		return new AmqpQueue({
			name: queue.name,
			bindings,
			type: queue.type as QueueType,
			options
		})
	}

	static retryAttemptQueueFrom(queue: AmqpQueue, attempt: number): AmqpQueue {
		if (queue.role !== QueueRole.CONSUMER) {
			throw new AmqpConfigError('Queue role should be "consumer" to create a retry attempt queue.')
		}
		return new AmqpQueue({
			name: queue.getRetryAttemptQueueName(attempt),
			type: queue.type,
			role: QueueRole.RETRY_ATTEMPT,
			options: {
				messageTtl: getRetryAttemptDelayInMilliseconds(attempt),
				deadLetterExchange: RETRY_EXCHANGE,
				deadLetterRoutingKey: getRetryAttemptRoutingKey(queue.name, attempt)
			}
		})
	}

	static retryFailureQueueFrom(queue: AmqpQueue): AmqpQueue {
		if (queue.role !== QueueRole.CONSUMER) {
			throw new AmqpConfigError('Queue role should be "consumer" to create a retry attempt queue.')
		}
		return new AmqpQueue({
			name: queue.getRetryFailureQueueName(),
			type: queue.type,
			role: QueueRole.RETRY_FAILURE,
			options: {
				messageTtl: RETRY_FAILURE_MESSAGE_TTL_IN_MILLISECONDS
			}
		})
	}

	static unprocessableQueueFrom(queue: AmqpQueue): AmqpQueue {
		if (queue.role !== QueueRole.CONSUMER) {
			throw new AmqpConfigError('Queue role should be "consumer" to create a retry attempt queue.')
		}
		return new AmqpQueue({
			name: queue.getUnprocessableQueueName(),
			type: queue.type,
			role: QueueRole.UNPROCESSABLE,
			options: {
				messageTtl: UNPROCESSABLE_MESSAGE_TTL_IN_MILLISECONDS
			}
		})
	}

	argumentEquals(config: AmqpQueue) {
		if (this.name !== config.name) {
			throw new Error('Compared queue config name should be equals.')
		}
		return isEqual(this.options, config.options)
	}

	getRetryAttemptQueueName(attempt: number): string {
		return `${this.name}.retry-${attempt}`
	}

	getRetryFailureQueueName(): string {
		return `${this.name}.retry-failure`
	}

	getUnprocessableQueueName(): string {
		return `${this.name}.unprocessable`
	}
}
