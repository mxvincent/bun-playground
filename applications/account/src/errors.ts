import { BaseError } from '@package/errors'

export type ResourceWriteOperation = 'create' | 'update' | 'delete'

/**
 * A write of a resource affects no row, or more than one
 */
export class ResourceNotWrittenError extends BaseError {
	code = 'RESOURCE_NOT_WRITTEN'
	readonly resourceType: string
	readonly operation: ResourceWriteOperation
	readonly resourceId: string

	constructor(resource: { type: string; id: string }, operation: ResourceWriteOperation, message: string) {
		super(message)
		this.resourceType = resource.type
		this.resourceId = resource.id
		this.operation = operation
	}

	override toJSON() {
		return { ...super.toJSON(), operation: this.operation, resource: { type: this.resourceType, id: this.resourceId } }
	}
}
