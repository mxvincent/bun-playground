import { TEST_DATABASE, testDataSource } from '#test-helpers/data-source'
import { EnvValue } from '@package/core'
import { SQL } from 'bun'
import { beforeAll } from 'bun:test'
import { getPostgresConnectionUri, initializeDataSource, teardownDataSource } from '../src'

beforeAll(async () => {
	const connectionUri = getPostgresConnectionUri({
		host: EnvValue.string('POSTGRES_HOST') ?? '127.0.0.1',
		port: EnvValue.number('POSTGRES_PORT') ?? 5432,
		database: EnvValue.string('POSTGRES_DATABASE') ?? 'mxvincent',
		username: EnvValue.string('POSTGRES_USERNAME') ?? 'mxvincent',
		password: EnvValue.string('POSTGRES_PASSWORD') ?? 'mxvincent'
	})
	const sql = new SQL(connectionUri)

	const [{ exists }] = await sql`select exists(select datname from pg_catalog.pg_database where datname = ${TEST_DATABASE})`

	if (!exists) {
		 await sql`create database ${sql(TEST_DATABASE)}`
	}

	await Promise.all([
		sql.close({ timeout: 500 }),
		initializeDataSource(testDataSource, {
			runMigrations: true,
			createSchema: true
		})
	])

	await teardownDataSource(testDataSource)
})


