import { describe, expect, it } from 'bun:test'
import {
	getRetryAttemptBinding,
	getRetryAttemptDelayInMilliseconds,
	getRetryAttemptQueueName,
	getRetryAttemptRoutingKey,
	getRetryExchangeConfig,
	getRetryFailureQueueName,
	RETRY_EXCHANGE
} from './retry'

describe('getRetryDelayInMilliseconds', () => {
	it.each([
		[1, 1000],
		[2, 16000],
		[3, 81000],
		[4, 256000]
	])('should return retry delay as a number attempt #%i', async (attempt, delayInMilliseconds) => {
		expect(getRetryAttemptDelayInMilliseconds(attempt)).toBe(delayInMilliseconds)
	})

	it.each([-1, 0])('should throw an error when requested attempt is not valid (%i)', async (attempt) => {
		expect(() => getRetryAttemptDelayInMilliseconds(attempt)).toThrowError(
			new TypeError('Parameter "attempt" should be a positive integer.')
		)
	})
})

describe('getRetryExchangeConfig', () => {
	it('should return retry exchange config', async () => {
		expect(getRetryExchangeConfig()).toEqual({
			name: 'retry',
			type: 'topic'
		})
	})
})

describe('getRetryQueueName', () => {
	it('should return retry queue name', async () => {
		expect(getRetryAttemptQueueName('sensor.measure-emitted', 1)).toBe('sensor.measure-emitted.retry-1')
	})
})

describe('getRetryFailureQueueName', () => {
	it('should return retry queue name', async () => {
		expect(getRetryFailureQueueName('test-queue')).toBe(`test-queue.retry-failure`)
	})
})

describe('getRetryAttemptRoutingKey()', () => {
	it('should return retry routing key for a any attempt', async () => {
		expect(getRetryAttemptRoutingKey('sensor.measure-emitted')).toBe('retry.sensor.measure-emitted.retry-attempt.*')
	})
	it('should return retry routing key for a specific attempt', async () => {
		expect(getRetryAttemptRoutingKey('sensor.measure-emitted', 1)).toBe('retry.sensor.measure-emitted.retry-attempt.1')
	})
})

describe('getRetryBinding()', () => {
	it('should return retry binding', async () => {
		expect(getRetryAttemptBinding('sensor.measure-emitted')).toEqual({
			exchange: RETRY_EXCHANGE,
			routingKey: getRetryAttemptRoutingKey('sensor.measure-emitted')
		})
	})
})
