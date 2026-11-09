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
})
