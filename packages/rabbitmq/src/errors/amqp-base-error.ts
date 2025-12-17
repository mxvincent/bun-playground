import { BaseError } from '@package/errors'

export abstract class AmqpBaseError extends BaseError {
	abstract override readonly code: string
}
