import { expect, test } from 'bun:test'
import { RabbitMQManagementAPIError } from './rabbitmq-management-api-error'

test('RabbitMQManagementAPIError.toJSON() keeps status code 500 and adds the request URL and the response status', () => {
	const error = new RabbitMQManagementAPIError('[RabbitMQ] List queues query failed.', {
		requestUrl: 'https://localhost/api/queues/vhost',
		responseStatus: 404,
		responseStatusText: 'Not Found'
	})
	expect(error.toJSON()).toStrictEqual({
		statusCode: 500,
		message: '[RabbitMQ] List queues query failed.',
		code: 'RABBITMQ_MANAGEMENT_API_ERROR',
		requestUrl: 'https://localhost/api/queues/vhost',
		responseStatus: 404,
		responseStatusText: 'Not Found'
	})
})
