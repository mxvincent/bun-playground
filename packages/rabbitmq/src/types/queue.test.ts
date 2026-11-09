import { describe, expect, it } from 'bun:test'
import { RETRY_EXCHANGE } from '../amqp/retry'
import { AmqpConfigError } from '../errors/amqp-config-error'
import type { ManagementApiQueue } from '../management/types'
import {
	AmqpQueue,
	QueueRole,
	QueueType,
	RETRY_FAILURE_MESSAGE_TTL_IN_MILLISECONDS,
	UNPROCESSABLE_MESSAGE_TTL_IN_MILLISECONDS
} from './queue'

const consumerQueue = new AmqpQueue({ name: 'orders', type: QueueType.CLASSIC })

describe('new AmqpQueue()', () => {
	it('defaults to a quorum consumer queue without binding', () => {
		expect(new AmqpQueue({ name: 'orders' })).toMatchObject({
			type: QueueType.QUORUM,
			role: QueueRole.CONSUMER,
			bindings: []
		})
	})

	it('declares its type in the queue arguments', () => {
		expect(consumerQueue.options.arguments).toStrictEqual({ 'x-queue-type': QueueType.CLASSIC })
	})
})

describe('derived queues', () => {
	it('retryAttemptQueueFrom() delays the message, then dead-letters it to the retry exchange', () => {
		expect(AmqpQueue.retryAttemptQueueFrom(consumerQueue, 2)).toMatchObject({
			name: 'orders.retry-2',
			type: QueueType.CLASSIC,
			role: QueueRole.RETRY_ATTEMPT,
			options: {
				messageTtl: 16000,
				deadLetterExchange: RETRY_EXCHANGE,
				deadLetterRoutingKey: 'retry.orders.retry-attempt.2'
			}
		})
	})

	it('retryFailureQueueFrom() keeps the messages 7 days', () => {
		expect(AmqpQueue.retryFailureQueueFrom(consumerQueue)).toMatchObject({
			name: 'orders.retry-failure',
			role: QueueRole.RETRY_FAILURE,
			options: { messageTtl: RETRY_FAILURE_MESSAGE_TTL_IN_MILLISECONDS }
		})
	})

	it('unprocessableQueueFrom() keeps the messages 7 days', () => {
		expect(AmqpQueue.unprocessableQueueFrom(consumerQueue)).toMatchObject({
			name: 'orders.unprocessable',
			role: QueueRole.UNPROCESSABLE,
			options: { messageTtl: UNPROCESSABLE_MESSAGE_TTL_IN_MILLISECONDS }
		})
	})

	it.each([
		['retryAttemptQueueFrom', () => AmqpQueue.retryAttemptQueueFrom(AmqpQueue.retryFailureQueueFrom(consumerQueue), 1)],
		['retryFailureQueueFrom', () => AmqpQueue.retryFailureQueueFrom(AmqpQueue.retryFailureQueueFrom(consumerQueue))],
		['unprocessableQueueFrom', () => AmqpQueue.unprocessableQueueFrom(AmqpQueue.retryFailureQueueFrom(consumerQueue))]
	])('%s() rejects a queue that is not a consumer queue', (_factory, derive) => {
		expect(derive).toThrow(AmqpConfigError)
	})
})

describe('AmqpQueue.fromAmqpQueue()', () => {
	const declared = {
		name: 'orders',
		type: 'quorum',
		arguments: { 'x-dead-letter-exchange': 'dlx', 'x-dead-letter-routing-key': 'dead', 'x-message-ttl': 1000 }
	} as unknown as ManagementApiQueue

	it('reads the dead letter and ttl arguments of a declared queue', () => {
		expect(AmqpQueue.fromAmqpQueue(declared, [{ exchange: 'loan', routingKey: 'loan.created' }])).toMatchObject({
			name: 'orders',
			type: QueueType.QUORUM,
			bindings: [{ exchange: 'loan', routingKey: 'loan.created' }],
			options: { deadLetterExchange: 'dlx', deadLetterRoutingKey: 'dead', messageTtl: 1000 }
		})
	})
})

describe('AmqpQueue.argumentEquals()', () => {
	it('is true for the same options', () => {
		expect(new AmqpQueue({ name: 'orders' }).argumentEquals(new AmqpQueue({ name: 'orders' }))).toBe(true)
	})

	it('is false for other options', () => {
		const withTtl = new AmqpQueue({ name: 'orders', options: { messageTtl: 1000 } })
		expect(new AmqpQueue({ name: 'orders' }).argumentEquals(withTtl)).toBe(false)
	})

	it('throws for queues with other names', () => {
		expect(() => new AmqpQueue({ name: 'orders' }).argumentEquals(new AmqpQueue({ name: 'other' }))).toThrow(
			'Compared queue config name should be equals.'
		)
	})
})
