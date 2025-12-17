import { ValidationError } from '@package/errors'
import type { ErrorObject } from 'ajv'

export class JsonSchemaValidationError extends ValidationError<ErrorObject> {
	readonly context?: string
	readonly payload?: unknown

	constructor(
		message: string,
		options: {
			errors: ErrorObject[]
			context?: string
			payload?: unknown
		}
	) {
		super(message, options.errors)
		this.context = options.context
		this.payload = options.payload
	}
}
