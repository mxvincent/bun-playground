import { resourceColumns } from '@package/drizzle'
import { relations } from 'drizzle-orm'
import { text } from 'drizzle-orm/pg-core'
import { organizationMember } from '#/database/schemas/organization-members'
import { accountSchema } from '#database/schema'

export const user = accountSchema.table('user', {
	...resourceColumns,
	email: text('email').notNull().unique(),
	username: text('username').notNull().unique()
})

export type UserRow = typeof user.$inferSelect

/**
 * Define `User` relations
 */
export const userRelations = relations(user, ({ many }) => ({
	organizations: many(organizationMember)
}))
