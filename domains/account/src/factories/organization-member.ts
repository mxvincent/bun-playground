import { generateResource } from '@package/database'
import type { OrganizationMember } from '../schemas/organization-member'
import { createOrganization } from './organization'
import { createUserAccount } from './user-account'

export function createOrganizationMember(values: Partial<OrganizationMember>): OrganizationMember {
	return {
		...generateResource(values),
		organization: values?.organization ?? createOrganization(),
		user: values?.user ?? createUserAccount()
	}
}
