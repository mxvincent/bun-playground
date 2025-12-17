import { generateUUID } from '@package/core'
import { type PgTimestampConfig, timestamp, uuid } from 'drizzle-orm/pg-core'

export const timestampColumnOptions: PgTimestampConfig = Object.freeze({
	precision: 3,
	withTimezone: true,
	mode: 'date'
})

export const resourceColumns = {
	id: uuid('id').primaryKey().$defaultFn(generateUUID),
	createdAt: timestamp('created_at', timestampColumnOptions).notNull(),
	updatedAt: timestamp('updated_at', timestampColumnOptions).notNull(),
	deletedAt: timestamp('deleted_at', timestampColumnOptions)
}
