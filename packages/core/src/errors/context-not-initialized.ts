import { BaseError } from '@package/errors'

/**
 * An async store is read outside of the context that initializes it
 */
export class ContextNotInitializedError extends BaseError {
	code = 'CONTEXT_NOT_INITIALIZED'

	constructor() {
		super('Context is not initialized.')
	}
}
