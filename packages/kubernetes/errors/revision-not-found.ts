import { BaseError } from '@package/errors'

/**
 * A `package.json` has no version to use as revision
 */
export class KubernetesRevisionNotFoundError extends BaseError {
	code = 'KUBERNETES_REVISION_NOT_FOUND'
	readonly packageJsonPath: string

	constructor(packageJsonPath: string) {
		super(`Failed to load revision from ${packageJsonPath}`)
		this.packageJsonPath = packageJsonPath
	}

	override toJSON() {
		return { ...super.toJSON(), packageJsonPath: this.packageJsonPath }
	}
}
