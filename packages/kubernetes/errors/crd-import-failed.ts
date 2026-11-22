import { BaseError } from '@package/errors'

/**
 * `cdk8s import` exits with a non-zero code
 */
export class KubernetesCrdImportFailedError extends BaseError {
	code = 'KUBERNETES_CRD_IMPORT_FAILED'
	readonly source: string

	constructor(source: string) {
		super(`cdk8s import ${source} failed`)
		this.source = source
	}

	override toJSON() {
		return { ...super.toJSON(), source: this.source }
	}
}
