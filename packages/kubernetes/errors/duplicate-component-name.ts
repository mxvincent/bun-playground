import { BaseError } from '@package/errors'

/**
 * Two components of a namespace share a name
 */
export class KubernetesDuplicateComponentNameError extends BaseError {
	code = 'KUBERNETES_DUPLICATE_COMPONENT_NAME'
	readonly namespace: string
	readonly component: string

	constructor(namespace: string, component: string) {
		super(`Duplicate component name in namespace ${namespace}: ${component}`)
		this.namespace = namespace
		this.component = component
	}

	override toJSON() {
		return { ...super.toJSON(), namespace: this.namespace, component: this.component }
	}
}
