import { EnvValue } from '@package/core'
import { pino } from 'pino'
import type { AmqpConfig } from '../src'

export const config: AmqpConfig = {
	connection: {
		host: EnvValue.string('RABBITMQ_HOST') ?? 'localhost',
		port: EnvValue.number('RABBITMQ_PORT') ?? 5672,
		vhost: EnvValue.string('RABBITMQ_VHOST') ?? 'mxvincent',
		username: EnvValue.string('RABBITMQ_USERNAME') ?? 'mxvincent',
		password: EnvValue.string('RABBITMQ_PASSWORD') ?? 'mxvincent',
		timeoutInSeconds: 60
	},
	managementApi: {
		url: 'https://localhost'
	},
	logger: pino({ level: 'info' }),
	features: {
		messageProcessingRetry: false
	}
}
