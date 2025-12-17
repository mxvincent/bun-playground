import type { JsonSchemaValidationError } from '@package/json-schema'
import { AmqpBaseError } from './amqp-base-error'

export class AmqpParseMessageError extends AmqpBaseError {
	code = 'AMQP_PARSE_CONTENT_ERROR'
	messageContent: unknown
	originalError: unknown
	validationErrors?: JsonSchemaValidationError['errors']

	constructor(
		message: string,
		options: {
			messageContent: unknown
			originalError: unknown
			validationErrors?: JsonSchemaValidationError['errors']
		}
	) {
		super(message)
		this.messageContent = options.messageContent
		this.originalError = options.originalError
		this.validationErrors = options.validationErrors
	}

	static fromValidationError(error: JsonSchemaValidationError) {
		return new AmqpParseMessageError(`[AMQP] Failed to validate message.`, {
			messageContent: error.payload,
			originalError: error,
			validationErrors: error.errors
		})
	}

	override toJSON() {
		return {
			...super.toJSON(),
			validationErrors: this.validationErrors
		}
	}
}
