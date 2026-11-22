import { BaseError } from '@package/errors'

/**
 * No parent directory of a path is the repository root
 */
export class KubernetesRepositoryRootNotFoundError extends BaseError {
	code = 'KUBERNETES_REPOSITORY_ROOT_NOT_FOUND'

	constructor() {
		super('Failed to find repository root dir')
	}
}
