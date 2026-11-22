import { BaseError } from '@package/errors'

export type RandomStringParameter = 'alphabet' | 'length'

/**
 * The random string generator is given an alphabet or a length it cannot use
 */
export class InvalidRandomStringParameterError extends BaseError {
	code = 'INVALID_RANDOM_STRING_PARAMETER'
	readonly parameter: RandomStringParameter

	constructor(parameter: RandomStringParameter, message: string) {
		super(message)
		this.parameter = parameter
	}

	override toJSON() {
		return { ...super.toJSON(), parameter: this.parameter }
	}
}
