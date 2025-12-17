import type { TopicBinding, TopicConfig } from '../types/topic'

export const RETRY_EXCHANGE = 'retry'
export const RETRY_ATTEMPTS_HEADER = 'x-retry-attempt'

/**
 * Returns the configuration for the retry exchange.
 */
export const getRetryExchangeConfig = (): TopicConfig => ({
	name: RETRY_EXCHANGE,
	type: 'topic'
})

/**
 * Returns the routing key.
 * When `attempt` is not provided, it will return a wildcard routing key.
 */
export const getRetryAttemptRoutingKey = (queue: string, attempt?: number): string => {
	return `retry.${queue}.retry-attempt.${attempt ? attempt : '*'}`
}

/**
 * Returns the binding for retry queues.
 */
export const getRetryAttemptBinding = (queue: string): TopicBinding => {
	return {
		exchange: RETRY_EXCHANGE,
		routingKey: getRetryAttemptRoutingKey(queue)
	}
}

/**
 * Returns the delay in milliseconds for a given attempt.
 */
export const getRetryAttemptDelayInMilliseconds = (attempt: number): number => {
	if (!Number.isInteger(attempt) || attempt < 1) {
		throw new TypeError('Parameter "attempt" should be a positive integer.')
	}
	return attempt ** 4 * 1000
}

/**
 * Returns the name of the retry queue for a given attempt.
 */
export const getRetryAttemptQueueName = (queue: string, attempt?: number): string => {
	return `${queue}.retry-${attempt}`
}

/**
 * Returns the name of the retry failure queue.
 */
export const getRetryFailureQueueName = (queue: string): string => {
	return `${queue}.retry-failure`
}

/**
 * Check if given queue name match retry queue name pattern
 */
export const isRetryQueue = (queue: string): boolean => {
	return /^.+\.(retry-)([0-9]+|failure)/.test(queue)
}
