import { afterAll, afterEach, beforeAll, describe, expect, it, spyOn } from 'bun:test'
import amqplib from 'amqplib'
import { config } from '#test-helpers/config'
import { managementApiServer } from '#test-helpers/management-api'
import { AmqpClient } from '../amqp/client'
import { RabbitMQManagementClient } from './client'

const mockAmqpConnect = spyOn(amqplib, 'connect').mockImplementation(() => Promise.resolve({} as never))

afterEach(async () => {
	mockAmqpConnect.mockClear()
})

// const channel = new FakeChannel() as unknown as ChannelWrapper
const client = new AmqpClient(config)
const management = new RabbitMQManagementClient(client)

beforeAll(() => {
	managementApiServer.listen()
})

afterAll(() => {
	managementApiServer.close()
})

// const diffQueueBindingsMock = spyOn(RabbitMQManagementClient.prototype, 'diffQueueBindings')

// describe('RabbiMQClient.configureQueue()', () => {
// 	describe('ensure required queues are configured', () => {
// 		it('should only assert main queue', async () => {
// 			const queueConfig = new AmqpQueueConfig({ name: 'test-queue' })
//
// 			await management.configureQueue(queueConfig, { channel })
//
// 			expect(channel.assertQueue).toHaveBeenCalledTimes(1)
// 			expect(channel.assertQueue).toHaveBeenCalledWith('test-queue', { arguments: { 'x-queue-type': 'quorum' } })
// 		})
//
// 		it('should not create retry queues when feature is not enabled', async () => {
// 			const queueConfig = new AmqpQueueConfig({ name: 'test-queue', retryAttempts: 2 })
//
// 			await management.configureQueue(queueConfig, { channel })
//
// 			expect(channel.assertQueue).toHaveBeenCalledTimes(1)
// 			expect(channel.assertQueue).toHaveBeenCalledWith(queueConfig.name, { arguments: { 'x-queue-type': 'quorum' } })
// 		})
// 	})
//
// 	it('should not add retry exchange binding when retry feature is not enabled', async () => {
// 		const queueConfig = new AmqpQueueConfig({ name: 'test-queue', retryAttempts: 2 })
//
// 		await management.configureQueue(queueConfig, { channel })
//
// 		expect(diffQueueBindingsMock).toHaveBeenCalledTimes(1)
// 		expect(queueConfig.bindings).toHaveLength(0)
// 	})
// })
//
// describe('feature - message processing retry', () => {
// 	const channel = new FakeChannel() as unknown as ChannelWrapper
// 	const client = new AmqpClient({
// 		...config,
// 		features: {
// 			messageProcessingRetry: false
// 		}
// 	})
// 	const management = new RabbitMQManagement(client)
//
// 	describe('ensure queues are configured', () => {
// 		it('should only assert main queue', async () => {
// 			const queueConfig = new AmqpQueueConfig({ name: 'test-queue', retryAttempts: 0 })
//
// 			await management.configureQueue(queueConfig, { channel })
//
// 			expect(channel.assertQueue).toHaveBeenCalledTimes(1)
// 			expect(channel.assertQueue).toHaveBeenCalledWith('test-queue', { arguments: { 'x-queue-type': 'quorum' } })
// 		})
//
// 		it('should assert main queue and retry queues with default retry attempts setting', async () => {
// 			const queueConfig = new AmqpQueueConfig({ name: 'test-queue' })
// 			const retryFailureQueueConfig = getRetryFailureQueueConfig(queueConfig)
//
// 			await management.configureQueue(queueConfig, { channel })
//
// 			expect(channel.assertQueue).toHaveBeenCalledTimes(DEFAULT_MESSAGE_PROCESSING_RETRY_ATTEMPTS + 2)
// 			expect(channel.assertQueue).toHaveBeenCalledWith('test-queue', { arguments: { 'x-queue-type': 'quorum' } })
// 			expect(channel.assertQueue).toHaveBeenCalledWith(retryFailureQueueConfig.name, retryFailureQueueConfig.options)
// 			for (const attempt of range(1, DEFAULT_MESSAGE_PROCESSING_RETRY_ATTEMPTS + 1)) {
// 				const retry1QueueConfig = getRetryAttemptQueueConfig(queueConfig, attempt)
// 				expect(channel.assertQueue).toHaveBeenCalledWith(retry1QueueConfig.name, retry1QueueConfig.options)
// 			}
// 		})
//
// 		it('should assert main queue and retry queues with custom retry attempts setting', async () => {
// 			const queueConfig = new AmqpQueueConfig({ name: 'test-queue', retryAttempts: 2 })
// 			const retryFailureQueueConfig = getRetryFailureQueueConfig(queueConfig)
// 			const retry1QueueConfig = getRetryAttemptQueueConfig(queueConfig, 1)
// 			const retry2QueueConfig = getRetryAttemptQueueConfig(queueConfig, 2)
//
// 			await management.configureQueue(queueConfig, { channel })
//
// 			expect(channel.assertQueue).toHaveBeenCalledTimes(4)
// 			expect(channel.assertQueue).toHaveBeenCalledWith(queueConfig.name, { arguments: { 'x-queue-type': 'quorum' } })
// 			expect(channel.assertQueue).toHaveBeenCalledWith(retryFailureQueueConfig.name, retryFailureQueueConfig.options)
// 			expect(channel.assertQueue).toHaveBeenCalledWith(retry1QueueConfig.name, retry1QueueConfig.options)
// 			expect(channel.assertQueue).toHaveBeenCalledWith(retry2QueueConfig.name, retry2QueueConfig.options)
// 		})
// 	})
//
// 	describe('configure retry exchange binding', () => {
// 		it('should not add binding when retry is disabled', async () => {
// 			const queueConfig = new AmqpQueueConfig({ name: 'test-queue', retryAttempts: 0 })
//
// 			await management.configureQueue(queueConfig, { channel })
//
// 			expect(diffQueueBindingsMock).toHaveBeenCalledTimes(1)
// 			expect(queueConfig.bindings).toHaveLength(0)
// 		})
// 		it('should add bindings when retry is enabled', async () => {
// 			const queueConfig = new AmqpQueueConfig({ name: 'test-queue', retryAttempts: 1 })
//
// 			await management.configureQueue(queueConfig, { channel })
//
// 			expect(queueConfig.bindings).toEqual([
// 				{
// 					exchange: RETRY_EXCHANGE,
// 					routingKey: getRetryAttemptRoutingKey(queueConfig)
// 				}
// 			])
// 		})
// 		it('should prevent retry binding to be added twice', async () => {
// 			const queueConfig = new AmqpQueueConfig({ name: 'test-queue', retryAttempts: 1 })
//
// 			await management.configureQueue(queueConfig, { channel })
// 			await management.configureQueue(queueConfig, { channel })
// 			await management.configureQueue(queueConfig, { channel })
//
// 			expect(queueConfig.bindings).toEqual([
// 				{
// 					exchange: RETRY_EXCHANGE,
// 					routingKey: getRetryAttemptRoutingKey(queueConfig)
// 				}
// 			])
// 		})
// 	})
// })

describe('diffQueueBindings', () => {
	it('should make diff between queue bindings and given configuration', async () => {
		const diff = await management.diffQueueBindings({
			name: 'test-queue',
			bindings: [
				{ exchange: 'credit', routingKey: 'credit.created' },
				{ exchange: 'credit', routingKey: 'credit.updated' }
			]
		})
		expect(diff).toEqual({
			added: [
				{ exchange: 'credit', routingKey: 'credit.created' },
				{ exchange: 'credit', routingKey: 'credit.updated' }
			],
			removed: [
				{ exchange: 'loan', routingKey: 'loan.created' },
				{ exchange: 'loan', routingKey: 'loan.updated' }
			]
		})
	})
})
