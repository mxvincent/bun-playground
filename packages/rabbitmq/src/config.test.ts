import { describe, expect, test } from 'bun:test'
import { pino } from 'pino'
import { getAmqpConnectionUrl, getManagementApiAuthorizationHeader, getManagementApiConfigUrl } from './config'
import type { AmqpConfig } from './schemas/config'

const config: AmqpConfig = {
	connection: {
		host: 'rabbitmq.local',
		port: 5672,
		vhost: 'test-vhost',
		username: 'test-user',
		password: 'test-pass',
		timeoutInSeconds: 60
	},
	managementApi: {
		url: 'https://rabbitmq-management.local'
	},
	logger: pino({ level: 'silent' }),
	features: {
		messageProcessingRetry: false
	}
}
describe('RabbitMQ config', () => {
	test('should return amqp connection URL', () => {
		expect(getAmqpConnectionUrl(config)).toEqual('amqp://test-user:test-pass@rabbitmq.local:5672/test-vhost')
	})

	test('should return management API URL', () => {
		expect(getManagementApiConfigUrl(config)).toBe('https://rabbitmq-management.local')
	})

	test('should return management API authorization header', async () => {
		expect(getManagementApiAuthorizationHeader(config)).toBe('Basic dGVzdC11c2VyOnRlc3QtcGFzcw==')
	})
})
