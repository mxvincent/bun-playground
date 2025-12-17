import { organizationMember, organizationMemberRelations } from '#/database/schemas/organization-members'
import { organization, organizationRelations } from '#/database/schemas/organizations'
import { user, userRelations } from '#/database/schemas/users'

export const tables = {
	organization,
	organizationMember,
	user
}

export const relations = {
	organizationRelations,
	organizationMemberRelations,
	userRelations
}
