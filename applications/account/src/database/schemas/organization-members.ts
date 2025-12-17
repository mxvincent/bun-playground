import { resourceColumns } from '@package/drizzle'
import { relations } from 'drizzle-orm'
import { uuid } from 'drizzle-orm/pg-core'
import { accountSchema } from '#database/schema'
import { organization } from './organizations'
import { user } from './users'

export const organizationMember = accountSchema.table('organization_member', {
	...resourceColumns,
	organizationId: uuid('organization_id')
		.notNull()
		.references(() => organization.id),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id)
})

export type OrganizationMemberRow = typeof organizationMember.$inferSelect

/**
 * Define `OrganizationMember` relations
 */
export const organizationMemberRelations = relations(organizationMember, ({ one }) => ({
	organization: one(organization, {
		fields: [organizationMember.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [organizationMember.userId],
		references: [user.id]
	})
}))
