import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
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
		await client.query(`truncate ${TABLE}`)
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
		await client.query(`truncate ${TABLE}`)
	})

	it('is active between start and commit only', async () => {
		await context.startTransaction()
		const isActive = context.isTransactionActive
		await context.commitTransaction()
		expect([isActive, context.isTransactionActive]).toEqual([true, false])
	})
})
