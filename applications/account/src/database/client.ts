import { logger } from '@package/telemetry'
import { drizzle } from 'drizzle-orm/node-postgres'
import { pgSchema } from 'drizzle-orm/pg-core'
import { Pool } from 'pg'
import { config } from '#/core/config'
import { relations, tables } from '#database/tables'

export const accountSchema = pgSchema(config.database.schema)

const pool = new Pool({
	host: config.database.host,
	port: config.database.port,
	database: config.database.database,
	user: config.database.username,
	password: config.database.password,
	statement_timeout: 60000
})

export const database = drizzle(pool, {
	logger: false,
	schema: {
		...tables,
		...relations
	}
})

await database.$client.connect()

logger.info('Database connection established')
