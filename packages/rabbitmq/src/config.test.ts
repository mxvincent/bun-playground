import { expect, test } from 'bun:test'
import { config } from '#test-helpers/config'
import { getAmqpConnectionUrl, getManagementApiAuthorizationHeader, getManagementApiConfigUrl } from './config'

test('should return amqp connection URL', () => {
	expect(getAmqpConnectionUrl(config)).toEqual('amqp://mxvincent:mxvincent@rabbitmq.tld:5672/mxvincent')
})

test('should return management API URL', () => {
	expect(getManagementApiConfigUrl(config)).toBe('https://rabbitmq.tld')
})

test('should return management API authorization header', async () => {
	expect(getManagementApiAuthorizationHeader(config)).toBe('Basic bXh2aW5jZW50Om14dmluY2VudA==')
})
