import { NotFoundError } from './http'

export type ResourceId = string | object

/**
 * A filter of a lookup, typed structurally: @package/errors has no dependency on @package/query-params
 */
export type ResourceFilter = { toJSON(): unknown }

/**
 * A resource that is not found, looked up by its id or by filters
 */
export class ResourceNotFoundError extends NotFoundError {
	override code = 'RESOURCE_NOT_FOUND'
	resourceType: string
	resourceId?: ResourceId
	filters?: ResourceFilter[]

	constructor(resourceType: string, resourceId?: ResourceId) {
		super()
		this.resourceType = resourceType
		this.resourceId = resourceId
		this.message = `Resource not found`
	}

	/**
	 * A resource looked up by filters, e.g. in a repository `findOneOrFail(filters)`
	 */
	static fromFilters(resourceType: string, filters: ResourceFilter[]): ResourceNotFoundError {
		const error = new ResourceNotFoundError(resourceType)
		error.filters = filters
		return error
	}

	override toString() {
		if (this.filters) {
			return `${super.toString()}: filters=${JSON.stringify(this.filters)}`
		}
		if (this.resourceId === undefined) {
			return super.toString()
		}
		const parameters =
			typeof this.resourceId === 'string'
				? this.resourceId
				: Object.entries(this.resourceId ?? {})
						.map(([key, value]) => `${key}=${typeof value === 'object' ? JSON.stringify(value) : value}`)
						.join(',')
		return `${super.toString()}: ${parameters}`
	}

	override toJSON() {
		const resource = this.filters
			? { type: this.resourceType, filters: this.filters.map((filter) => filter.toJSON()) }
			: this.resourceId === undefined
				? { type: this.resourceType }
				: { type: this.resourceType, id: this.resourceId }
		return { ...super.toJSON(), resource }
	}
}
