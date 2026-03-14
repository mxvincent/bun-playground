import { afterAll, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { invariant, jsonToBuffer } from '@package/core'
import { logger } from '@package/telemetry'
import type { ConsumeMessage } from 'amqplib'
import { createFakeMessage, createMeasureMessageContent, MeasureMessageSchema } from '#test-helpers/message'
import { Consumer } from './consumer'

const loggerInfoSpy = spyOn(logger, 'info')
const loggerWarnSpy = spyOn(logger, 'warn')
const loggerErrorSpy = spyOn(logger, 'error')

afterAll(() => {
	mock.restore()
})

// const mockJsonToBuffer = mock((data: unknown) => Buffer.from(JSON.stringify(data)))
// mock.module('@package/core', () => ({
// 	jsonToBuffer: mockJsonToBuffer
// }))

const mockGetRetryAttemptQueueName = mock((queue: string, attempt: number) => `${queue}.retry-${attempt}`)
const mockGetRetryFailureQueueName = mock((queue: string) => `${queue}.retry-failure`)
mock.module('./retry', () => ({
	getRetryAttemptQueueName: mockGetRetryAttemptQueueName,
	getRetryFailureQueueName: mockGetRetryFailureQueueName,
	RETRY_ATTEMPTS_HEADER: 'x-retry-attempts'
}))

const mockChannel = {
	consume: mock(() => Promise.resolve({ consumerTag: 'amq.ctag-test' })),
	cancel: mock(() => Promise.resolve()),
	ack: mock(),
	nack: mock(),
	sendToQueue: mock(() => Promise.resolve())
}

const mockClient = {
	createChannel: mock(() => mockChannel)
}

const queue = 'test-queue'

const handler = mock(() => Promise.resolve())

let consumer: Consumer<typeof MeasureMessageSchema>

function clearAllMocks() {
	loggerInfoSpy.mockClear()
	loggerWarnSpy.mockClear()
	loggerErrorSpy.mockClear()

	mockChannel.consume.mockClear()
	mockChannel.cancel.mockClear()
	mockChannel.ack.mockClear()
	mockChannel.nack.mockClear()
	mockChannel.sendToQueue.mockClear()

	mockClient.createChannel.mockClear()

	// mockJsonToBuffer.mockClear()
	mockGetRetryAttemptQueueName.mockClear()
	mockGetRetryFailureQueueName.mockClear()
	handler.mockClear()
}

beforeEach(() => {
	clearAllMocks()

	consumer = new Consumer(mockClient as never, {
		queue,
		schema: MeasureMessageSchema,
		handler,
		concurrency: 10,
		retryAttempts: 2,
		keepUnprocessableMessages: true,
		logMessageContent: true
	})
})

describe('Consumer.start()', () => {
	it('should start consumer', async () => {
		await consumer.start()

		expect(mockClient.createChannel).toHaveBeenCalledWith({ name: queue })

		expect(mockChannel.consume).toHaveBeenCalledTimes(1)
		expect(mockChannel.consume).toHaveBeenCalledWith(
			queue,
			expect.any(Function),
			expect.objectContaining({ prefetch: 10 })
		)

		expect(loggerInfoSpy).toHaveBeenCalledWith(
			{
				amqp: {
					concurrency: 10,
					keepUnprocessableMessages: true,
					logMessageContent: true,
					queue: 'test-queue',
					retryAttempts: 2
				}
			},
			'[AMQP] Subscription configured.'
		)
	})

	it('should not start if already started', async () => {
		await consumer.start()
		await consumer.start()

		expect(mockChannel.consume).toHaveBeenCalledTimes(1)
		expect(loggerWarnSpy).toHaveBeenCalledWith(
			expect.anything(),
			expect.stringContaining('Subscription already started')
		)
	})
})

describe('Consumer.setConcurrency()', () => {
	it('should update prefetch count and restart subscription', async () => {
		await consumer.start()
		clearAllMocks()

		await consumer.setConcurrency(20)

		expect(mockChannel.cancel).toHaveBeenCalledTimes(1)
		expect(mockChannel.consume).toHaveBeenCalledTimes(1)
		expect(mockChannel.consume).toHaveBeenCalledWith(
			queue,
			expect.anything(),
			expect.objectContaining({ prefetch: 20 })
		)
	})
})

describe('Consumer.stop()', () => {
	it('should cancel subscription if running', async () => {
		await consumer.start()
		await consumer.stop()

		expect(mockChannel.cancel).toHaveBeenCalledWith('amq.ctag-test')
	})

	it('should do nothing if not running', async () => {
		await consumer.stop()

		expect(mockChannel.cancel).not.toHaveBeenCalled()
	})
})

describe('Consumer.consumeMessage()', () => {
	beforeEach(async () => {
		await consumer.start()
	})

	const sendMessage = async (message: ConsumeMessage | null) => {
		const callback = invariant(mockChannel.consume.mock.lastCall?.at(1)) as never as (
			message: ConsumeMessage | null
		) => Promise<void>
		await callback(message)
	}

	it('should process valid message successfully', async () => {
		const content = createMeasureMessageContent()
		const message = createFakeMessage(jsonToBuffer(content))

		await sendMessage(message)

		expect(handler).toHaveBeenCalledWith(content)
		expect(mockChannel.ack).toHaveBeenCalledWith(message)
		expect(loggerInfoSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				amqp: expect.objectContaining({
					queue: 'test-queue',
					message: {
						fields: message.fields,
						properties: message.properties,
						content
					}
				})
			}),
			'[AMQP] Message processed.'
		)
	})

	it('should ignore null messages', async () => {
		await sendMessage(null)

		expect(handler).not.toHaveBeenCalled()
		expect(mockChannel.ack).toHaveBeenCalledTimes(0)
	})

	it.skip('should ack and publish message as unprocessable when content is not valid', async () => {
		const message = createFakeMessage(jsonToBuffer({ value: 12 }))

		await sendMessage(message)

		expect(handler).not.toHaveBeenCalled()
		expect(mockChannel.ack).toHaveBeenCalledWith(message)

		expect(loggerErrorSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				amqp: expect.objectContaining({
					queue: 'test-queue',
					message: {
						fields: message.fields,
						properties: message.properties,
						content: message.content
					},
					retry: {
						attempt: 0,
						isEnabled: true,
						remainingAttempts: 2
					}
				}),
				error: {
					code: 'AMQP_PARSE_CONTENT_ERROR',
					message: '[AMQP] Failed to validate message.',
					validationErrors: [
						{
							instancePath: '',
							keyword: 'required',
							message: "must have required property 'sensor'",
							params: {
								missingProperty: 'sensor'
							},
							schemaPath: '#/required'
						}
					]
				}
			}),
			'[AMQP] Failed to validate message.'
		)
	})
})

// 	describe('Validation Errors', () => {
// 		it('should handle invalid JSON (Parse Error)', async () => {
// 			const invalidJsonMsg = {
// 				...validMsg,
// 				content: Buffer.from('invalid-json')
// 			}
//
// 			await triggerConsume(invalidJsonMsg)
//
// 			expect(handler).not.toHaveBeenCalled()
// 			expect(mockLogger.error).toHaveBeenCalledWith(
// 				expect.objectContaining({
// 					error: expect.any(AmqpParseMessageError)
// 				}),
// 				expect.stringContaining('Fail to parse message')
// 			)
// 			// Should keep unprocessable message
// 			expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
// 				expect.stringContaining('retry'), // based on default mock implementation
// 				expect.any(Buffer),
// 				expect.anything()
// 			)
// 			expect(mockChannel.ack).toHaveBeenCalled()
// 		})
//
// 		it('should handle schema validation error', async () => {
// 			const invalidSchemaMsg = {
// 				...validMsg,
// 				content: Buffer.from(JSON.stringify({ id: '1', value: 'not-a-number' }))
// 			}
//
// 			await triggerConsume(invalidSchemaMsg)
//
// 			expect(handler).not.toHaveBeenCalled()
// 			expect(mockLogger.error).toHaveBeenCalledWith(
// 				expect.objectContaining({
// 					error: expect.objectContaining({
// 						message: expect.stringContaining('Fail to parse message')
// 					})
// 				}),
// 				expect.anything()
// 			)
// 			expect(mockChannel.ack).toHaveBeenCalled()
// 		})
// 	})
//
// 	describe('Handler Errors (Retry Logic)', () => {
// 		it('should retry message if handler fails and retries remain', async () => {
// 			handler.mockRejectedValueOnce(new Error('Processing failed'))
//
// 			await triggerConsume(validMsg)
//
// 			expect(mockLogger.error).toHaveBeenCalledWith(
// 				expect.anything(),
// 				expect.stringContaining('Message processing failed')
// 			)
//
// 			// Should send to retry queue (attempt 1)
// 			expect(mockGetRetryAttemptQueueName).toHaveBeenCalledWith(queueName, 1)
// 			expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
// 				`${queueName}-retry-1`,
// 				validMsg.content,
// 				expect.objectContaining({
// 					headers: { [RETRY_ATTEMPTS_HEADER]: 1 }
// 				})
// 			)
// 			expect(mockChannel.ack).toHaveBeenCalled()
// 		})
//
// 		it('should increment retry attempt count', async () => {
// 			handler.mockRejectedValueOnce(new Error('Processing failed'))
//
// 			const retryMsg = {
// 				...validMsg,
// 				properties: {
// 					headers: { [RETRY_ATTEMPTS_HEADER]: 1 }
// 				}
// 			}
//
// 			await triggerConsume(retryMsg)
//
// 			// Should send to retry queue (attempt 2)
// 			expect(mockGetRetryAttemptQueueName).toHaveBeenCalledWith(queueName, 2)
// 			expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
// 				`${queueName}-retry-2`,
// 				validMsg.content,
// 				expect.objectContaining({
// 					headers: { [RETRY_ATTEMPTS_HEADER]: 2 }
// 				})
// 			)
// 		})
//
// 		it('should send to failure queue when retries exhausted', async () => {
// 			handler.mockRejectedValueOnce(new Error('Processing failed'))
//
// 			// Configured for 2 retries, so this is the last attempt handling (incoming header says 2)
// 			// logic: current = 2. remaining = 2 - 2 = 0.
// 			// Actually, logic is: remaining = options.retryAttempts - currentAttempt.
// 			// if options.retry = 2.
// 			// 1st fail: current=0 -> next=1.
// 			// 2nd fail: current=1 -> next=2.
// 			// 3rd fail: current=2 -> remaining=0. -> failure queue.
//
// 			const exhaustedMsg = {
// 				...validMsg,
// 				properties: {
// 					headers: { [RETRY_ATTEMPTS_HEADER]: 2 }
// 				}
// 			}
//
// 			await triggerConsume(exhaustedMsg)
//
// 			expect(mockGetRetryFailureQueueName).toHaveBeenCalledWith(queueName)
// 			expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
// 				`${queueName}-dlq`,
// 				validMsg.content,
// 				expect.objectContaining({
// 					headers: { [RETRY_ATTEMPTS_HEADER]: 3 }
// 				})
// 			)
// 		})
//
// 		it('should not retry if retryAttempts is 0', async () => {
// 			// Create consumer with 0 retries
// 			const noRetryConsumer = new Consumer(mockClient as any, {
// 				queue: queueName,
// 				schema,
// 				concurrency: 1,
// 				retryAttempts: 0,
// 				handler,
// 				keepUnprocessableMessages: false,
// 				logMessageContent: false
// 			})
//
// 			// Helper to trigger for this specific instance
// 			await noRetryConsumer.start()
// 			const callback = mockChannel.consume.mock.lastCall[1]
//
// 			handler.mockRejectedValueOnce(new Error('Fail'))
//
// 			await callback(validMsg)
//
// 			expect(mockChannel.sendToQueue).not.toHaveBeenCalled()
// 			expect(mockChannel.ack).toHaveBeenCalled()
// 		})
// 	})
//
// 	describe('Ack Failures', () => {
// 		it('should nack if error handling fails', async () => {
// 			// Force an error inside handleError logic (e.g. sendToQueue fails)
// 			mockChannel.sendToQueue.mockRejectedValueOnce(new Error('Queue down'))
// 			handler.mockRejectedValueOnce(new Error('Handler failed'))
//
// 			await triggerConsume(validMsg)
//
// 			expect(mockChannel.nack).toHaveBeenCalledWith(validMsg)
// 			expect(mockLogger.error).toHaveBeenCalledWith(
// 				expect.objectContaining({ error: expect.any(Error) }),
// 				expect.stringContaining('Failed during ack')
// 			)
// 		})
// 	})
// })
