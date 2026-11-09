import type { DatabaseContext } from '@package/database'
import { logger } from '@package/telemetry'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import type pg from 'pg'

export class DrizzleDatabaseContext implements DatabaseContext {
	readonly client: pg.Client
	readonly database: NodePgDatabase
	private transactionDepth = 0

	constructor(client: pg.Client) {
		this.client = client
		this.database = drizzle(client)
	}

	get isTransactionActive() {
		return this.transactionDepth > 0
	}

	async startTransaction() {
		if (this.transactionDepth === 0) {
			await this.client.query('BEGIN')
		} else {
			await this.client.query(`SAVEPOINT sp_${this.transactionDepth}`)
		}
		this.transactionDepth++
	}

	/**
	 * Roll back the current transaction, or its last savepoint; without transaction, log a warning
	 */
	async rollbackTransaction() {
		if (!this.isTransactionActive) {
			// A rollback without transaction reveals unbalanced calls: warn, since debug logs are off in production
			logger.warn('There is no transaction to rollback.')
			return
		}
		const depth = this.transactionDepth - 1
		try {
			await this.client.query(depth === 0 ? 'ROLLBACK' : `ROLLBACK TO SAVEPOINT sp_${depth}`)
		} catch (error) {
			// Rollbacks run in error handlers: a failure is logged, so it does not replace the original error
			logger.error({ error, transactionDepth: depth }, 'Transaction rollback failed.')
		} finally {
			// The level is left whether the rollback succeeded or not
			this.transactionDepth = depth
		}
	}

	/**
	 * Commit the current transaction, or release its last savepoint; without transaction, log a warning
	 */
	async commitTransaction() {
		if (!this.isTransactionActive) {
			// A commit without transaction reveals unbalanced calls: warn, since debug logs are off in production
			logger.warn('There is no transaction to commit.')
			return
		}
		const depth = this.transactionDepth - 1
		if (depth === 0) {
			// PostgreSQL ends the transaction even when the COMMIT fails
			this.transactionDepth = 0
			const result = await this.client.query('COMMIT')
			// PostgreSQL answers COMMIT with ROLLBACK, and no error, when a statement of the transaction failed
			if (result.command === 'ROLLBACK') {
				throw new Error('Transaction rolled back: a statement of the transaction failed.')
			}
			return
		}
		// The depth only decreases once the release succeeds: a failed release keeps the level to roll back
		await this.client.query(`RELEASE SAVEPOINT sp_${depth}`)
		this.transactionDepth = depth
	}

	/**
	 * Run the callback in a transaction: commit when it resolves, roll back and rethrow when it rejects.
	 * Nested calls run in savepoints.
	 */
	async transaction<TResult>(callback: (database: NodePgDatabase) => Promise<TResult>): Promise<TResult> {
		await this.startTransaction()
		const depth = this.transactionDepth
		try {
			const result = await callback(this.database)
			await this.commitTransaction()
			return result
		} catch (error) {
			// Roll back this level and the ones the callback left open: a commit that PostgreSQL rolled back has already left it
			while (this.transactionDepth >= depth) {
				await this.rollbackTransaction()
			}
			throw error
		}
	}
}
