import { AmqpBaseError } from './amqp-base-error'

export class AmqpClientError extends AmqpBaseError {
	readonly code = `AMQP_CLIENT_ERROR`
}
