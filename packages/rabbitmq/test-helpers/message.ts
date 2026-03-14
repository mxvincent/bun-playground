import { Schema, type Static } from '@package/json-schema'
import type { ConsumeMessage } from 'amqplib'

export const MeasureMessageSchema = Schema.Object({
	sensor: Schema.String(),
	value: Schema.Number()
})

export type MeasureMessage = Static<typeof MeasureMessageSchema>

const fakeMeasureEmittedMessage: MeasureMessage = {
	sensor: 'c10c27c0-8e27-44b9-8362-ae0ace5590bc',
	value: 21.64
}

export const createMeasureMessageContent = (): MeasureMessage => {
	return structuredClone(fakeMeasureEmittedMessage)
}

export function createFakeMessage(content: Buffer): ConsumeMessage {
	return {
		fields: {
			consumerTag: '030053c37f8a5650bbcfeed09b442aa4',
			deliveryTag: 1,
			redelivered: false,
			exchange: 'test-exchange',
			routingKey: 'test-exchange.test-event-occurred'
		},
		properties: {
			contentType: undefined,
			contentEncoding: undefined,
			headers: {},
			deliveryMode: undefined,
			priority: undefined,
			correlationId: undefined,
			replyTo: undefined,
			expiration: undefined,
			messageId: undefined,
			timestamp: undefined,
			type: undefined,
			userId: undefined,
			appId: undefined,
			clusterId: undefined
		},
		content
	}
}
