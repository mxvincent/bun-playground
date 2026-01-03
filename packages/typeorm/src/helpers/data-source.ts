import { isString, type TeardownFunction, withTimeout } from '@package/core'
import { logger } from '@package/telemetry'
import { PinoLoggerAdapter } from '../adapters/logger'
import { type CreatePostgresDataSourceOptions, PostgresDataSource } from '../types/postgres-data-source'
import { runMigrations } from './migrations'
import { setPrimaryKeyColumns } from './primary-key'

export type PostgresConnectionUriOptions = {
	username: string
	password: string
	host?: string
	port?: number
	database?: string

}

export function getPostgresConnectionUri(options: PostgresConnectionUriOptions) {
	const credentials = `${options.username}:${options.password}`
	const host = `${options.host ?? 'localhost'}:${options.port ?? 5432}`
	const database = options.database ?? options.username
	return `postgres://${credentials}@${host}/${database}`
}

export const createPostgresDataSource = (options: CreatePostgresDataSourceOptions) => {
	return new PostgresDataSource({
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

const pickDataSourceProperties = (dataSource: PostgresDataSource) => {
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
	dataSource: PostgresDataSource,
	options?: {
		runMigrations?: boolean
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
export const teardownDataSource = async (dataSource: PostgresDataSource, timeoutInMs = 5000): Promise<void> => {
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
export const dataSourceShouldBeInitialized = (dataSource: PostgresDataSource): void => {
	if (!dataSource.isInitialized) {
		throw new Error(`DataSource should be initialized`)
	}
}
