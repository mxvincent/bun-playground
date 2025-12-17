import { jsonToBuffer, type Optional } from '@package/core'
import { JsonSchemaValidationError, type Static, type TObject, type TSchema } from '@package/json-schema'
import { createValidationFunction } from '@package/json-schema/src/validation/validate'
import { logger } from '@package/telemetry'

import type { ChannelWrapper } from 'amqp-connection-manager'
import type { ConsumeMessage } from 'amqplib'

import { AmqpParseMessageError } from '../errors/amqp-parse-message-error'
import type { AmqpQueue } from '../types/queue'
import type { AmqpClient } from './client'
import { getRetryAttemptQueueName, getRetryFailureQueueName, RETRY_ATTEMPTS_HEADER } from './retry'

function getMessageRetryAttempt(message: ConsumeMessage) {
	const headers = message.properties?.headers ?? {}
	return headers[RETRY_ATTEMPTS_HEADER] ?? 0
}

export interface ConsumerOptions<Schema extends TSchema> {
	/**
	 * Queue from which messages will be pulled
	 */
	queue: string | AmqpQueue

	/**
	 * Schema used to validate message content
	 */
	schema: Schema

	/**
	 * Function that handles message processing
	 * @param event
	 */
	handler: (event: Static<Schema>) => Promise<void>

	/**
	 * Limit message processing concurrency
	 */
	concurrency: number

	/**
	 * Configure the number of retry attempts for message processing.
	 */
	retryAttempts: number

	/**
	 * Keep unprocessable messages in a dedicated queue.
	 */
	keepUnprocessableMessages: boolean

	/**
	 * Embed message content in logs.
	 */
	logMessageContent: boolean

	/**
	 * Channel used to configure subscription
	 */
	channel?: ChannelWrapper
}

export class Consumer<Schema extends TObject> {
	readonly queue: string
	readonly queueConfig?: AmqpQueue
	readonly options: Pick<
		ConsumerOptions<Schema>,
		'concurrency' | 'keepUnprocessableMessages' | 'logMessageContent' | 'retryAttempts'
	>
	private readonly channel: ChannelWrapper
	private readonly handle: (event: Static<Schema>) => Promise<void>
	private readonly validate: (message: Record<string, unknown>) => Static<Schema>
	private consumerTag?: string
	private isManagingConsumer = false

	constructor(client: AmqpClient, { handler, schema, queue, channel, ...options }: ConsumerOptions<Schema>) {
		if (typeof queue === 'string') {
			this.queue = queue
		} else {
			this.queue = queue.name
			this.queueConfig = queue
		}
		this.channel = channel ?? client.createChannel({ name: this.queue })
		this.handle = handler
		this.options = {
			concurrency: options.concurrency,
			keepUnprocessableMessages: options.keepUnprocessableMessages ?? false,
			logMessageContent: options.logMessageContent ?? false,
			retryAttempts: options.retryAttempts ?? 0
		}
		this.validate = createValidationFunction(schema, { coerce: true })
	}

	async start() {
		if (this.consumerTag) {
			logger.warn(
				{
					amqp: { queue: this.queue }
				},
				`[AMQP] Subscription already started.`
			)
			return
		}

		if (this.isManagingConsumer) {
			logger.warn(
				{
					amqp: { queue: this.queue }
				},
				`[AMQP] Consumer is already starting or stopping.`
			)
			return
		}

		this.isManagingConsumer = true
		const { consumerTag } = await this.channel.consume(this.queue, this.consumeMessage.bind(this), {
			prefetch: this.options.concurrency
		})
		this.isManagingConsumer = false
		this.consumerTag = consumerTag

		logger.info(
			{
				amqp: {
					queue: this.queue,
					...this.options
				}
			},
			`[AMQP] Subscription configured.`
		)
	}

	async stop() {
		if (this.isManagingConsumer) {
			logger.warn(
				{
					amqp: { queue: this.queue }
				},
				`[AMQP] Consumer is already starting or stopping.`
			)
			return
		}
		if (this.consumerTag) {
			this.isManagingConsumer = true
			await this.channel.cancel(this.consumerTag)
			this.isManagingConsumer = false
			this.consumerTag = undefined
		}
	}

	async setConcurrency(concurrency: number) {
		await this.stop()
		this.options.concurrency = concurrency
		await this.start()
	}

	private parseMessageContent(
		message: ConsumeMessage,
		validate: (input: Record<string, unknown>) => Static<Schema>
	): Static<Schema> {
		try {
			const json = JSON.parse(message.content.toString('utf-8'))
			return validate(json)
		} catch (error) {
			if (error instanceof JsonSchemaValidationError) {
				throw AmqpParseMessageError.fromValidationError(error)
			}
			throw new AmqpParseMessageError('[AMQP] Fail to parse message.', {
				messageContent: message.content,
				originalError: error
			})
		}
	}

	private async publishUnprocessableMessage(message: ConsumeMessage, error: unknown) {
		const content = jsonToBuffer({ error, message })
		await this.channel.sendToQueue(getRetryAttemptQueueName(this.queue), content)
	}

	private async handleError(message: ConsumeMessage, error: unknown, messageContent?: unknown) {
		const currentAttempt = getMessageRetryAttempt(message)
		const amqp = {
			queue: this.queue,
			message: {
				fields: message.fields,
				properties: message.properties,
				content: messageContent ?? message.content
			} as Pick<ConsumeMessage, 'fields' | 'properties'> & {
				content: Optional<unknown>
			},
			retry: {
				isEnabled: !!this.options.retryAttempts,
				attempt: currentAttempt,
				remainingAttempts: this.options.retryAttempts - currentAttempt
			}
		}

		if (error instanceof AmqpParseMessageError) {
			if (this.options.logMessageContent) {
				amqp.message.content = error.messageContent
			}
			logger.error({ amqp, error: error.toJSON() }, error.message)
			if (this.options.keepUnprocessableMessages) {
				await this.publishUnprocessableMessage(message, error)
			}
			return
		}

		logger.error({ amqp, error }, `[AMQP] Message processing failed.`)

		if (amqp.retry.isEnabled) {
			return
		}

		await this.channel.sendToQueue(
			amqp.retry.remainingAttempts > 0
				? getRetryAttemptQueueName(this.queue, currentAttempt + 1)
				: getRetryFailureQueueName(this.queue),
			message.content,
			{
				headers: {
					[RETRY_ATTEMPTS_HEADER]: currentAttempt + 1
				}
			}
		)
	}

	private async consumeMessage(message: ConsumeMessage | null): Promise<void> {
		if (!message) {
			return
		}
		let content: Buffer<ArrayBufferLike> | Static<Schema> = message.content
		try {
			content = this.parseMessageContent(message, this.validate)
			await this.handle(content)
			logger.info(
				{
					amqp: {
						queue: this.queue,
						message: {
							fields: message.fields,
							properties: message.properties,
							content: this.options.logMessageContent ? content : undefined
						}
					}
				},
				`[AMQP] Message processed.`
			)
			this.channel.ack(message)
		} catch (error) {
			try {
				await this.handleError(message, error, content ?? message.content)
				return this.channel.ack(message)
			} catch (error) {
				logger.error({ error }, '[RabbitMQ] Failed during ack.')
				return this.channel.nack(message)
			}
		}
	}
}
