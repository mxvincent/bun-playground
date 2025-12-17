import { getRetryExchangeConfig } from '../amqp/retry'
import type { RabbitMQManagementClient } from './client'

export const configureRabbitMQSystemExchanges = async (client: RabbitMQManagementClient): Promise<void> => {
	await client.configureExchange(getRetryExchangeConfig())
}
