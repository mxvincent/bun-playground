import { NotFoundError } from './http'

export class ResourceNotFoundError<TWhere = string> extends NotFoundError {
	override code = 'RESOURCE_NOT_FOUND'
	resourceType: string
	resourceWhere: TWhere

	constructor(resourceType: string, resourceWhere: TWhere) {
		super()
		this.resourceType = resourceType
		this.resourceWhere = resourceWhere
		this.message = `Resource not found`
	}

	override toString() {
		return this.message
	}

	override toJSON() {
		return {
			...super.toJSON(),
			resource: {
				type: this.resourceType,
				match: this.resourceWhere
			}
		}
	}
}
