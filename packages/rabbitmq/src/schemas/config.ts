import { Schema, type Static } from '@package/json-schema'
import type { Channel } from 'amqp-connection-manager'
import type { BaseLogger } from 'pino'

export const AmqpConnectionConfigSchema = Schema.Object(
	{
		host: Schema.String({
			default: '127.0.0.1',
			description: 'RabbitMQ host.'
		}),
		port: Schema.Number({
			default: 5672,
			description: 'RabbitMQ port.'
		}),
		vhost: Schema.String({
			description: 'RabbitMQ vhost.'
		}),
		username: Schema.String({
			description: 'RabbitMQ username.'
		}),
		password: Schema.String({
			description: 'RabbitMQ password.'
		}),
		timeoutInSeconds: Schema.Integer({
			default: 60,
			description: 'RabbitMQ connection timeout in seconds.'
		})
	},
	{
		default: {},
		description: 'RabbitMQ configuration.'
	}
)
export type AmqpConnectionConfig = Static<typeof AmqpConnectionConfigSchema>

export const RabbitMQManagementApiConfigSchema = Schema.Object({
	url: Schema.String({
		default: 'localhost',
		description: 'RabbitMQ management API host.'
	})
})
export type RabbitMQManagementApiConfig = Static<typeof RabbitMQManagementApiConfigSchema>

export type AmqpFeatures = {
	messageProcessingRetry?: boolean
}

export type AmqpConfig = {
	connection: AmqpConnectionConfig
	managementApi?: RabbitMQManagementApiConfig
	logger?: BaseLogger
	features?: AmqpFeatures
	setup?: (channel: Channel) => Promise<void>
}
