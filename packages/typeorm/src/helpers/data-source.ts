import { isString, type TeardownFunction, withTimeout } from '@package/core'
import { type Logger, logger } from '@package/telemetry'
import { DataSource } from 'typeorm'
import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js'
import { PinoLoggerAdapter } from '../adapters/logger'
import { runMigrations } from './migrations'
import { setPrimaryKeyColumns } from './primary-key'

export class PostgresDatabaseSource extends DataSource {
	declare options: PostgresConnectionOptions
}

export class PostgresConnectionPoolOptions {
	/**
	 * Number of milliseconds to wait before timing out when connecting a new client
	 * Set to 0 to disable timeout
	 * @default 0 (no timeout)
	 */
	connectionTimeoutMillis: number = 0

	/**
	 * Number of milliseconds a client must sit idle in the pool and not be checked out before it is disconnected from the backend and discarded
	 * Set to 0 to disable auto-disconnection of idle clients
	 * 	@default 10000 (10 seconds)
	 */
	idleTimeoutMillis?: number = 10_000

	/**
	 * Maximum number of clients the pool should contain
	 * @default 10
	 */
	max: number = 10

	/**
	 * Default behavior is the pool will keep clients open & connected to the backend
	 * until idleTimeoutMillis expire for each client and node will maintain a ref
	 * to the socket on the client, keeping the event loop alive until all clients are closed
	 * after being idle or the pool is manually shutdown with `pool.end()`.
	 * Setting `allowExitOnIdle: true` in the config will allow the node event loop to exit
	 * as soon as all clients in the pool are idle, even if their socket is still open
	 * to the postgres server.  This can be handy in scripts & tests
	 * where you don't want to wait for your clients to go idle before your process exits.
	 * @default false
	 */
	releaseConnections: boolean = true

	constructor(options: Partial<PostgresConnectionPoolOptions>) {
		Object.assign<PostgresConnectionPoolOptions, Partial<PostgresConnectionPoolOptions>>(this, options)
	}
}

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

export const createPostgresDataSource = (options: CreatePostgresDataSourceOptions) => {
	return new PostgresDatabaseSource({
		schema: options.schema ?? 'public',
		type: 'postgres',
		host: options.host ?? '127.0.0.1',
		port: options.port ?? 5432,
		database: options.database,
		username: options.username,
		password: options.password,
		entities: options.entities ?? [],
		migrations: options.migrations ?? [],
		subscribers: options.subscribers ?? [],
		logger: new PinoLoggerAdapter(options.logger ?? logger),
		logging: ['info', 'log', 'error', 'warn', 'query'],
		migrationsTableName: '@migration',
		metadataTableName: '@metadata',
		maxQueryExecutionTime: options.slowQueryThresholdInMs ?? 1000,
		migrationsRun: false,
		synchronize: false
	})
}

const pickDataSourceProperties = (dataSource: PostgresDatabaseSource) => {
	return {
		database: dataSource.options.database,
		username: dataSource.options.username,
		host: dataSource.options.host,
		port: dataSource.options.port,
		type: dataSource.options.type
	}
}

/**
 * Initialize DataSource
 */
export const initializeDataSource = async (
	dataSource: PostgresDatabaseSource,
	options?: {
		runMigrations?: boolean
		createDatabase?: boolean
		createSchema?: boolean
	}
): Promise<TeardownFunction> => {
	if (dataSource.isInitialized) {
		logger.warn(
			{
				context: pickDataSourceProperties(dataSource)
			},
			`DataSource is already initialized.`
		)
		return async () => teardownDataSource(dataSource)
	}

	await dataSource.initialize()

	// configure primary keys for pagination helpers
	for (const entity of dataSource.entityMetadatas) {
		const name = isString(entity.target) ? entity.target : entity.target.name
		if (typeof entity.target !== 'function') {
			logger.warn(`Can not set primary key columns when entity target is string (entity=${name}).`)
			continue
		}
		setPrimaryKeyColumns(
			entity.target,
			entity.primaryColumns.map((column) => column.propertyName)
		)
	}

	if (options?.createDatabase) {
		const isDatabaseExists = await dataSource.query(
			`select 1
			 from pg_database
			 where datname = '${dataSource.options.database}';`
		)

		if (isDatabaseExists.length === 0) {
			await dataSource.query(`create database "${dataSource.options.database}";`)
			logger.info({ context: { database: dataSource.options.database } }, `Database created.`)
		}
	}

	if (options?.createSchema) {
		await dataSource.query(`create schema if not exists "${dataSource.options.schema}";`)
	}

	// optionally run database migrations
	if (options?.runMigrations) {
		await runMigrations(dataSource)
	}

	logger.info(
		{
			context: pickDataSourceProperties(dataSource)
		},
		`DataSource initialized.`
	)

	return () => teardownDataSource(dataSource)
}

/**
 * Tear down the given DataSource instance
 */
export const teardownDataSource = async (dataSource: PostgresDatabaseSource, timeoutInMs = 5000): Promise<void> => {
	if (dataSource.isInitialized) {
		await withTimeout(() => dataSource.destroy(), timeoutInMs, 'closeAllDatabaseConnections')
	}
	logger.info(
		{
			context: pickDataSourceProperties(dataSource)
		},
		`Close all database connections`
	)
}

/**
 * Throw and error when DataSource is not initialized
 */
export const dataSourceShouldBeInitialized = (dataSource: PostgresDatabaseSource): void => {
	if (!dataSource.isInitialized) {
		throw new Error(`DataSource should be initialized`)
	}
}
