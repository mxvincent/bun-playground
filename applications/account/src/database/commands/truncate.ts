import { serializers, syncLogger } from '@package/telemetry'
import { sql } from 'drizzle-orm'
import { database } from '#/database/client'
import { config } from '#core/config'

const truncate = async () => {
	await database.execute(sql`TRUNCATE ${config.database.schema}.organization CASCADE`)
	await database.execute(sql`TRUNCATE ${config.database.schema}.user CASCADE `)
	console.info('Database content deleted')

	await database.$client.end()

	process.exit(0)
}

truncate().catch((error) => {
	syncLogger.fatal({ error: serializers.error(error) })
	process.exit(1)
})
