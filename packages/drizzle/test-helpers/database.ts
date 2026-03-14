import { afterAll, afterEach, beforeAll, beforeEach } from 'bun:test'
import { EnvValue } from '@package/core'
import type { DatabaseContext } from '@package/database'
import pg from 'pg'
import { DrizzleDatabaseContext } from '../src/adapters/database-context'

export const TEST_DATABASE = 'test_drizzle'

export const getConnectionConfig = (database: string) => ({
	host: EnvValue.string('POSTGRES_HOST') ?? '127.0.0.1',
	port: EnvValue.number('POSTGRES_PORT') ?? 5432,
	database,
	user: EnvValue.string('POSTGRES_USERNAME') ?? 'mxvincent',
	password: EnvValue.string('POSTGRES_PASSWORD') ?? 'mxvincent'
})

export const useDatabaseTransaction = (context: DatabaseContext, isolation: 'group' | 'test' = 'test') => {
	if (isolation === 'group') {
		beforeAll(() => context.startTransaction())
		afterAll(() => context.rollbackTransaction())
	}

	if (isolation === 'test') {
		beforeEach(() => context.startTransaction())
		afterEach(() => context.rollbackTransaction())
	}
}

export const useDatabaseContext = (options?: { isolation?: 'group' | 'test' }): DrizzleDatabaseContext => {
	const client = new pg.Client(getConnectionConfig(TEST_DATABASE))
	const database = new DrizzleDatabaseContext(client)

	beforeAll(async () => await client.connect())

	useDatabaseTransaction(database, options?.isolation ?? 'test')

	afterAll(async () => await client.end())

	return database
}
