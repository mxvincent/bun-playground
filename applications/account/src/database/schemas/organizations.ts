import { resourceColumns } from '@package/drizzle'
import { relations } from 'drizzle-orm'
import { text } from 'drizzle-orm/pg-core'
import { organizationMember } from '#/database/schemas/organization-members'
import { accountSchema } from '#database/schema'

export const organization = accountSchema.table('organization', {
	...resourceColumns,
	name: text('name').notNull().unique()
})

export type OrganizationRow = typeof organization.$inferSelect

/**
 * Define `Organization` relations
 */
export const organizationRelations = relations(organization, ({ many }) => ({
	members: many(organizationMember)
}))

export const organizationParameters = Object.freeze({
	id: organization.id,
	name: organization.name,
	createdAt: organization.createdAt
})
