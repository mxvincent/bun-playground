import { BaseError } from '@package/errors'

/**
 * No primary key columns are registered for an entity with `setPrimaryKeyColumns()`
 */
export class TypeormPrimaryKeyNotConfiguredError extends BaseError {
	code = 'TYPEORM_PRIMARY_KEY_NOT_CONFIGURED'
	readonly entityName: string

	constructor(entityName: string) {
		super(`Primary key is not configured for ${entityName}`)
		this.entityName = entityName
	}

	override toJSON() {
		return { ...super.toJSON(), entity: { name: this.entityName } }
	}
}
