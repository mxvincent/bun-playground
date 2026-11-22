import { BaseError } from '@package/errors'

/**
 * PostgreSQL answered COMMIT with ROLLBACK: a statement of the transaction failed
 */
export class DrizzleTransactionRolledBackError extends BaseError {
	code = 'DRIZZLE_TRANSACTION_ROLLED_BACK'

	constructor() {
		super('Transaction rolled back: a statement of the transaction failed.')
	}
}
