import { afterAll, afterEach, beforeAll, describe, expect, it, mock, spyOn } from 'bun:test'
import { logger } from '@package/telemetry'
import pg from 'pg'
import { getConnectionConfig, TEST_DATABASE } from '#test-helpers/database'
import { DrizzleDatabaseContext } from './database-context'

// Own client and table: the transactions below commit for real
const client = new pg.Client(getConnectionConfig(TEST_DATABASE))
const context = new DrizzleDatabaseContext(client)
const TABLE = 'drizzle_database_context_test'

const values = async () =>
	(await client.query(`select value from ${TABLE} order by value`)).rows.map((row) => row.value)
const insert = (value: string) => client.query(`insert into ${TABLE} (value) values ($1)`, [value])

beforeAll(async () => {
	await client.connect()
	await client.query(`create table if not exists ${TABLE} (value text not null)`)
	await client.query(`truncate ${TABLE}`)
})

// Runs even when a test fails: no spy, open transaction or row leaks into the next test
afterEach(async () => {
	mock.restore()
	while (context.isTransactionActive) {
		await context.rollbackTransaction()
	}
	await client.query(`truncate ${TABLE}`)
})

afterAll(async () => {
	await client.query(`drop table if exists ${TABLE}`)
	await client.end()
})

describe('DrizzleDatabaseContext', () => {
	it('commits a transaction', async () => {
		await context.startTransaction()
		await insert('committed')
		await context.commitTransaction()
		expect(await values()).toEqual(['committed'])
	})

	it('rolls back a transaction', async () => {
		await context.startTransaction()
		await insert('rolled back')
		await context.rollbackTransaction()
		expect(await values()).toEqual([])
	})

	it('rolls back a nested transaction to its savepoint only', async () => {
		await context.startTransaction()
		await insert('outer')
		await context.startTransaction()
		await insert('inner')
		await context.rollbackTransaction()
		await context.commitTransaction()
		expect(await values()).toEqual(['outer'])
	})

	it('is active between start and commit only', async () => {
		await context.startTransaction()
		const isActive = context.isTransactionActive
		await context.commitTransaction()
		expect([isActive, context.isTransactionActive]).toEqual([true, false])
	})

	it.each([
		'commitTransaction',
		'rollbackTransaction'
	] as const)('ignores %s without transaction, so the next transaction still works', async (method) => {
		await context[method]()
		await context.startTransaction()
		await insert('after')
		await context.commitTransaction()
		expect([await values(), context.isTransactionActive]).toEqual([['after'], false])
	})

	it('keeps the outer changes when the commit of a failed savepoint throws and the savepoint is rolled back', async () => {
		await context.startTransaction()
		await insert('outer')
		await context.startTransaction()
		await insert('inner')
		// A failing statement aborts the transaction: releasing the savepoint then fails
		await client.query(`insert into ${TABLE} (value) values (null)`).catch(() => undefined)
		await expect(context.commitTransaction()).rejects.toThrow()
		await context.rollbackTransaction()
		await context.commitTransaction()
		expect(await values()).toEqual(['outer'])
	})

	it('ends the transaction when the top-level commit throws', async () => {
		await context.startTransaction()
		// A deferred unique constraint is only checked by the COMMIT
		await client.query('create temp table deferred_unique (value int unique deferrable initially deferred)')
		await client.query('insert into deferred_unique values (1), (1)')
		await expect(context.commitTransaction()).rejects.toThrow()
		expect(context.isTransactionActive).toBe(false)
	})

	it('throws when committing a transaction whose statement failed, which PostgreSQL rolls back', async () => {
		await context.startTransaction()
		await insert('lost')
		await client.query(`insert into ${TABLE} (value) values (null)`).catch(() => undefined)
		await expect(context.commitTransaction()).rejects.toThrow('Transaction rolled back')
		expect([await values(), context.isTransactionActive]).toEqual([[], false])
	})

	it('logs a failed rollback instead of throwing, and leaves the level', async () => {
		const errorLogSpy = spyOn(logger, 'error')
		await context.startTransaction()
		await context.startTransaction()
		// The savepoint no longer exists: rolling back to it fails
		await client.query('RELEASE SAVEPOINT sp_1')
		await context.rollbackTransaction()
		const loggedMessage = errorLogSpy.mock.lastCall?.at(1)
		expect([context.isTransactionActive, loggedMessage]).toEqual([true, 'Transaction rollback failed.'])
	})

	it.each([
		['commitTransaction', 'There is no transaction to commit.'],
		['rollbackTransaction', 'There is no transaction to rollback.']
	] as const)('warns about %s without transaction', async (method, message) => {
		const warnLogSpy = spyOn(logger, 'warn')
		await context[method]()
		const loggedMessage = warnLogSpy.mock.lastCall?.at(0)
		expect(loggedMessage).toBe(message)
	})
})

describe('DrizzleDatabaseContext.transaction()', () => {
	it('commits the changes of the callback and returns its result', async () => {
		const result = await context.transaction(async () => {
			await insert('committed')
			return 'result'
		})
		expect([result, await values(), context.isTransactionActive]).toEqual(['result', ['committed'], false])
	})

	it('rolls back the changes of a failing callback and rethrows its error', async () => {
		const failure = context.transaction(async () => {
			await insert('rolled back')
			throw new Error('failure')
		})
		await expect(failure).rejects.toThrow('failure')
		expect([await values(), context.isTransactionActive]).toEqual([[], false])
	})

	it('rolls back the levels that a failing callback left open', async () => {
		const failure = context.transaction(async () => {
			await insert('rolled back')
			await context.startTransaction()
			throw new Error('failure')
		})
		await expect(failure).rejects.toThrow('failure')
		expect([await values(), context.isTransactionActive]).toEqual([[], false])
	})

	it('runs a nested call in a savepoint', async () => {
		await context.transaction(async () => {
			await insert('outer')
			await context
				.transaction(async () => {
					await insert('inner')
					throw new Error('inner failure')
				})
				.catch(() => undefined)
		})
		expect(await values()).toEqual(['outer'])
	})

	it('rethrows the rolled back commit of a failed statement without rolling back again', async () => {
		const warnLogSpy = spyOn(logger, 'warn')
		const failure = context.transaction(async () => {
			await insert('lost')
			// The callback swallows the error of a statement: PostgreSQL rolls the commit back
			await client.query(`insert into ${TABLE} (value) values (null)`).catch(() => undefined)
		})
		const outcome = await failure.then(
			() => 'resolved',
			(error: Error) => error.message
		)
		const warnings = warnLogSpy.mock.calls.length
		expect([outcome, warnings, await values()]).toEqual([
			'Transaction rolled back: a statement of the transaction failed.',
			0,
			[]
		])
	})
})
