import { BaseError } from './base'

export class ValidationError<ErrorType> extends BaseError {
	code = 'VALIDATION_ERROR'
	override statusCode = 400
	errors!: ErrorType[]

	constructor(message: string, errors: ErrorType[]) {
		super(message)
		this.errors = errors
	}

	override toJSON() {
		return {
			...super.toJSON(),
			reasons: this.errors
		}
	}
}
