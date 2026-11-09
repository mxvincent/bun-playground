import type { DatabaseContext } from '@package/database'
import { logger } from '@package/telemetry'
import type { EntityManager, QueryRunner } from 'typeorm'
import type { PostgresDataSource } from '../types/postgres-data-source'

export type IsolationLevel = 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE'

export class TypeormDatabaseContext implements DatabaseContext {
	readonly dataSource: PostgresDataSource
	readonly useInheritedQueryRunner: boolean
	private queryRunner?: QueryRunner

	constructor(dataSource: PostgresDataSource, options?: { queryRunner?: QueryRunner }) {
		this.dataSource = dataSource
		if (options?.queryRunner) {
			this.useInheritedQueryRunner = true
			this.queryRunner = options.queryRunner
			logger.debug('Query runner reused.')
		} else {
			this.useInheritedQueryRunner = false
		}
	}

	get isTransactionActive() {
		return this.queryRunner?.isTransactionActive ?? false
	}

	get manager(): EntityManager {
		const manager = this.queryRunner?.manager ?? this.dataSource.manager
		manager.transaction = (<T>(
			isolationLevelOrCallback: IsolationLevel | ((manager: EntityManager) => Promise<T>),
			maybeCallback?: (manager: EntityManager) => Promise<T>
		): Promise<T> => {
			if (typeof isolationLevelOrCallback === 'function') {
				return this.transaction(isolationLevelOrCallback)
			}
			return this.transaction(maybeCallback!, isolationLevelOrCallback)
		}) as typeof manager.transaction
		return manager
	}

	/**
	 * Start a transaction, or a savepoint when a transaction is already active
	 * The query runner tracks the depth: each level is committed or rolled back on its own
	 */
	async startTransaction(isolationLevel?: IsolationLevel) {
		if (!this.queryRunner) {
			this.queryRunner = this.dataSource.createQueryRunner()
		}
		const isNested = this.queryRunner.isTransactionActive
		await this.queryRunner.startTransaction(isolationLevel)
		logger.debug(isNested ? 'Save point created.' : 'Transaction started.')
	}

	async commitTransaction() {
		if (this.queryRunner?.isTransactionActive) {
			await this.queryRunner.commitTransaction()
			logger.debug('Transaction commit completed.')
			await this.releaseQueryRunnerWhenDone()
		} else {
			logger.debug('There is no transaction to commit.')
		}
	}

	async rollbackTransaction() {
		if (this.queryRunner?.isTransactionActive) {
			try {
				await this.queryRunner.rollbackTransaction()
				logger.debug('Transaction rollback completed.')
				await this.releaseQueryRunnerWhenDone()
			} catch (error) {
				logger.debug({ error }, 'Transaction rollback failed.')
			}
		} else {
			logger.debug('There is no transaction to rollback.')
		}
	}

	async query<T = unknown>(query: string, parameters?: unknown[]): Promise<T> {
		return this.dataSource.query(query, parameters, this.queryRunner)
	}

	async transaction<TResult>(runInTransaction: (manager: EntityManager) => Promise<TResult>): Promise<TResult>
	async transaction<TResult>(
		runInTransaction: (manager: EntityManager) => Promise<TResult>,
		isolationLevel: IsolationLevel
	): Promise<TResult>
	async transaction<TResult>(
		runInTransaction: (manager: EntityManager) => Promise<TResult>,
		isolationLevel?: IsolationLevel
	): Promise<TResult> {
		await this.startTransaction(isolationLevel)
		try {
			const result = await runInTransaction(this.manager)
			await this.commitTransaction()
			return result
		} catch (error) {
			await this.rollbackTransaction()
			throw error
		}
	}

	/**
	 * Release the query runner once the outermost transaction is over
	 */
	private async releaseQueryRunnerWhenDone(): Promise<void> {
		if (!this.queryRunner || this.useInheritedQueryRunner || this.queryRunner.isTransactionActive) {
			return
		}
		if (this.queryRunner.isReleased) {
			logger.debug('Transaction query runner is already released.')
		} else {
			await this.queryRunner.release()
			logger.debug('Transaction query runner released.')
		}
		this.queryRunner = undefined
	}
}
