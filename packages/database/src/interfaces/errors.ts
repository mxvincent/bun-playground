import { NotFoundError } from '@package/errors'
import type { Filter } from '@package/query-params'

export class EntityNotFoundError extends NotFoundError {
	override readonly code = 'ENTITY_NOT_FOUND'
	readonly entity: string
	readonly filters: Filter[]

	constructor(entity: string, filters: Filter[]) {
		super(`Entity not found`)
		this.entity = entity
		this.filters = filters
	}

	override toJSON() {
		return {
			...super.toJSON(),
			filters: this.filters.map((filter) => filter.toJSON())
		}
	}
}
