import { NotFoundError } from './http'

export type ResourceId = string | object

export class ResourceNotFoundError extends NotFoundError {
	override code = 'RESOURCE_NOT_FOUND'
	resourceType: string
	resourceId: ResourceId

	constructor(resourceType: string, resourceId: ResourceId) {
		super()
		this.resourceType = resourceType
		this.resourceId = resourceId
		this.message = `Resource not found`
	}

	override toString() {
		const parameters =
			typeof this.resourceId === 'string'
				? this.resourceId
				: Object.entries(this.resourceId)
						.map(([key, value]) => `${key}=${value}`)
						.join(',')
		return this.message + ':' + parameters
	}

	override toJSON() {
		return {
			...super.toJSON(),
			resource: {
				type: this.resourceType,
				id: this.resourceId
			}
		}
	}
}
