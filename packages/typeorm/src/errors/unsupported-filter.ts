import { BaseError } from '@package/errors'

/**
 * A comparison filter uses an operator that has no SQL translation
 */
export class TypeormUnsupportedFilterError extends BaseError {
	code = 'TYPEORM_UNSUPPORTED_FILTER'
	readonly operator: string
	readonly path: string

	constructor(filter: { operator: string; path: string }) {
		super(`Operator not supported ${filter.operator}`)
		this.operator = filter.operator
		this.path = filter.path
	}

	override toJSON() {
		return { ...super.toJSON(), filter: { operator: this.operator, path: this.path } }
	}
}
