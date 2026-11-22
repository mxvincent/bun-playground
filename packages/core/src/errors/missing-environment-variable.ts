import { BaseError } from '@package/errors'

/**
 * A required environment variable is not set
 */
export class MissingEnvironmentVariableError extends BaseError {
	code = 'MISSING_ENVIRONMENT_VARIABLE'
	readonly variableName: string

	constructor(variableName: string) {
		super(`Environment variable is missing: ${variableName}`)
		this.variableName = variableName
	}

	override toJSON() {
		return { ...super.toJSON(), variable: { name: this.variableName } }
	}
}
