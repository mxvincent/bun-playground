import { BaseError } from '@package/errors'

/**
 * The primary key columns registered for an entity are empty
 */
export class TypeormInvalidPrimaryKeyError extends BaseError {
	code = 'TYPEORM_INVALID_PRIMARY_KEY'
	readonly entityName: string

	constructor(entityName: string, message: string) {
		super(message)
		this.entityName = entityName
	}

	override toJSON() {
		return { ...super.toJSON(), entity: { name: this.entityName } }
	}
}
