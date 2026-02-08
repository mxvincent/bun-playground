import type { Logger } from '@package/telemetry'
import { DataSource } from 'typeorm'
import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js'
import type { PostgresConnectionPoolOptions } from './postgres-connection-pool-options'

export type CreatePostgresDataSourceOptions = {
	host?: string
	port?: number
	database: string
	username: string
	password: string
	schema?: string
	slowQueryThresholdInMs?: number
	entities?: string[]
	migrations?: string[]
	subscribers?: string[]
	pool?: PostgresConnectionPoolOptions
	logger?: Logger
}

export class PostgresDataSource extends DataSource {
	declare options: PostgresConnectionOptions
}
