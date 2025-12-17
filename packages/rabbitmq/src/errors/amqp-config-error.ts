import { AmqpBaseError } from './amqp-base-error'

export class AmqpConfigError extends AmqpBaseError {
	readonly code = `AMQP_CONFIG_ERROR`
}
