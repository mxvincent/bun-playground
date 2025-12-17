import type { Editable, Resource } from '@package/database'
import type { Organization } from './organization'
import type { UserAccount } from './user-account'

export enum OrganizationMemberRole {}

export interface OrganizationMember extends Resource, Editable {
	organization: Organization
	user: UserAccount
}
