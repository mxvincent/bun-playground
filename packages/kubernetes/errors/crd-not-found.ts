import { BaseError } from '@package/errors'

/**
 * The downloaded bundles of an API group hold no CustomResourceDefinition
 */
export class KubernetesCrdNotFoundError extends BaseError {
	code = 'KUBERNETES_CRD_NOT_FOUND'
	readonly group: string

	constructor(group: string) {
		super(`No CustomResourceDefinition found for ${group}`)
		this.group = group
	}

	override toJSON() {
		return { ...super.toJSON(), group: this.group }
	}
}
