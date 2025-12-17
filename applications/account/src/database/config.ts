import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'
import { config } from '#/core/config'

export default defineConfig({
	schema: './src/database/schemas',
	out: './src/database/migrations',
	dialect: 'postgresql',
	migrations: {
		table: 'account_migrations',
		schema: 'drizzle'
	},
	dbCredentials: {
		host: config.database.host,
		port: config.database.port,
		database: config.database.database,
		user: config.database.username,
		password: config.database.password,
		ssl: false
	}
})
