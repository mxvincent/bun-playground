import { BaseError } from '@package/errors'

/**
 * A data source is used before `initialize()` resolved
 */
export class TypeormDataSourceNotInitializedError extends BaseError {
	code = 'TYPEORM_DATA_SOURCE_NOT_INITIALIZED'

	constructor() {
		super('DataSource should be initialized')
	}
}
