export abstract class BaseError extends Error {
	abstract readonly code: string
	readonly statusCode: number = 500

	override toString() {
		return `[${this.code}] ${this.message}`
	}

	toJSON() {
		return {
			statusCode: this.statusCode,
			message: this.message,
			code: this.code
		}
	}
}

export abstract class AuthorizationError extends BaseError {}
