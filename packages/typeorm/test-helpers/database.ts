import { afterAll, afterEach, beforeAll, beforeEach } from 'bun:test'
import { TypeormDatabaseContext } from '../src/adapters/database-context'
import { initializeDataSource, teardownDataSource } from '../src/helpers/data-source'
import type { PostgresDataSource } from '../src/types/postgres-data-source'
import { testDataSource } from './data-source'

export const useDatabaseContext = (options?: {
	isolationLevel?: 'group' | 'test'
	dataSource?: PostgresDataSource
}): TypeormDatabaseContext => {
	const dataSource = options?.dataSource ?? testDataSource
	const database = new TypeormDatabaseContext(dataSource)

	beforeAll(async () => {
		await initializeDataSource(dataSource)
		await dataSource.synchronize()
	})

	useDatabaseTransaction(database, options?.isolationLevel ?? 'group')

	afterAll(async () => {
		await teardownDataSource(dataSource, 500)
	})

	return database
}

export const useDatabaseTransaction = (database: TypeormDatabaseContext, isolation: 'group' | 'test' = 'test') => {
	if (isolation === 'group') {
		beforeAll(() => database.startTransaction())
		afterAll(() => database.rollbackTransaction())
	}

	if (isolation === 'test') {
		beforeEach(() => database.startTransaction())
		afterEach(() => database.rollbackTransaction())
	}
}
