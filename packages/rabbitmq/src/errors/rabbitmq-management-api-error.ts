import { AmqpBaseError } from './amqp-base-error'

/**
 * The RabbitMQ management API answered a request with an unexpected status.
 *
 * That status is kept in `responseStatus`, not in `statusCode`: `statusCode` is the status a service
 * returns to its own client, and a failed call to RabbitMQ stays a 500 for that client.
 */
export class RabbitMQManagementAPIError extends AmqpBaseError {
	readonly code = 'RABBITMQ_MANAGEMENT_API_ERROR'
	readonly requestUrl: string
	readonly responseStatus: number
	readonly responseStatusText: string

	constructor(message: string, options: { requestUrl: string; responseStatus: number; responseStatusText: string }) {
		super(message)
		this.requestUrl = options.requestUrl
		this.responseStatus = options.responseStatus
		this.responseStatusText = options.responseStatusText
	}

	override toJSON() {
		return {
			...super.toJSON(),
			requestUrl: this.requestUrl,
			responseStatus: this.responseStatus,
			responseStatusText: this.responseStatusText
		}
	}
}
