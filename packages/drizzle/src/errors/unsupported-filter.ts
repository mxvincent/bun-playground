import { BaseError } from '@package/errors'

/**
 * A comparison filter uses an operator that has no SQL translation
 */
export class DrizzleUnsupportedFilterError extends BaseError {
	code = 'DRIZZLE_UNSUPPORTED_FILTER'
	readonly operator: string
	readonly path: string

	constructor(filter: { operator: string; path: string }) {
		super('Filter is not configured')
		this.operator = filter.operator
		this.path = filter.path
	}

	override toJSON() {
		return { ...super.toJSON(), filter: { operator: this.operator, path: this.path } }
	}
}
