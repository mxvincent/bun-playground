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

	async rollbackTransaction() {
		this.transactionDepth--
		if (this.transactionDepth === 0) {
			await this.client.query('ROLLBACK')
		} else {
			await this.client.query(`ROLLBACK TO SAVEPOINT sp_${this.transactionDepth}`)
		}
	}

	async commitTransaction() {
		this.transactionDepth--
		if (this.transactionDepth === 0) {
			await this.client.query('COMMIT')
		} else {
			await this.client.query(`RELEASE SAVEPOINT sp_${this.transactionDepth}`)
		}
	}
}
