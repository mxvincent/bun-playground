import type { DatabaseContext } from '@package/database'
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
	 * Roll back the current transaction, or its last savepoint; without transaction, do nothing
	 */
	async rollbackTransaction() {
		if (!this.isTransactionActive) {
			return
		}
		this.transactionDepth--
		if (this.transactionDepth === 0) {
			await this.client.query('ROLLBACK')
		} else {
			await this.client.query(`ROLLBACK TO SAVEPOINT sp_${this.transactionDepth}`)
		}
	}

	/**
	 * Commit the current transaction, or release its last savepoint; without transaction, do nothing
	 */
	async commitTransaction() {
		if (!this.isTransactionActive) {
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
}
