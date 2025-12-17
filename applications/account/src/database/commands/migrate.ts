import * as path from 'node:path'
import { logger, syncLogger } from '@package/telemetry'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { database } from '#/database/client'
import { config } from '#core/config'

try {
	await migrate(database, {
		migrationsFolder: path.resolve('src/database/migrations'),
		migrationsSchema: config.database.schema,
		migrationsTable: '@migrations'
	})
	logger.info('database migrated')
} catch (error) {
	syncLogger.fatal({ error })
} finally {
	await database.$client.end()
}
