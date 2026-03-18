import { EnvValue } from '@package/core'
import { logger } from '@package/telemetry'
import { PinoLoggerAdapter } from '../src'
import { PostgresDataSource } from '../src/types/postgres-data-source'
import { Author, DateContainer, Post } from './entities'

export const TEST_DATABASE = 'test_typeorm'

export const testDataSource = new PostgresDataSource({
	type: 'postgres',
	schema: EnvValue.string('POSTGRES_SCHEMA') ?? 'public',
	host: EnvValue.string('POSTGRES_HOST') ?? '127.0.0.1',
	port: EnvValue.number('POSTGRES_PORT') ?? 5432,
	database: TEST_DATABASE,
	username: EnvValue.string('POSTGRES_USERNAME') ?? 'mxvincent',
	password: EnvValue.string('POSTGRES_PASSWORD') ?? 'mxvincent',
	entities: [Author, Post, DateContainer],
	logger: new PinoLoggerAdapter(logger)
})
