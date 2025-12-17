import { pgSchema } from 'drizzle-orm/pg-core'
import { config } from '#core/config'

export const accountSchema = pgSchema(config.database.schema)
