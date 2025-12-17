import type { AmqpConfig } from './schemas/config'

/**
 * Amqp connection URL
 */
export const getAmqpConnectionUrl = (config: AmqpConfig): string => {
	const { username, password, host, port, vhost } = config.connection
	return `amqp://${username}:${password}@${host}:${port}/${vhost ?? ''}`
}

/**
 * RabbitMQ management API URL
 */
export const getManagementApiConfigUrl = (config: AmqpConfig): string | null => {
	if (config.managementApi) {
		return config.managementApi.url
	}
	return null
}

/**
 * Rabbitmq management API authorization header
 */
export const getManagementApiAuthorizationHeader = (config: AmqpConfig): string => {
	return `Basic ${Buffer.from(`${config.connection.username}:${config.connection.password}`).toString('base64')}`
}
