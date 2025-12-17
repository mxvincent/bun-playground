import type { Repository, RepositoryGetPage } from '@package/database'
import type { Organization } from '../schemas/organization'

export interface CreateOrganization {
	name: string
}

export interface UpdateOrganization {
	name: string
}

export type OrganizationRepository = Repository<Organization, CreateOrganization, UpdateOrganization> &
	RepositoryGetPage<Organization>
