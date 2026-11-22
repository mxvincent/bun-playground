import { BaseError } from '@package/errors'

/**
 * The secret of a workload config is generated a second time
 */
export class KubernetesConfigAlreadyGeneratedError extends BaseError {
	code = 'KUBERNETES_CONFIG_ALREADY_GENERATED'

	constructor() {
		super('ConfigFile.createManifests() should be called exactly once.')
	}
}
