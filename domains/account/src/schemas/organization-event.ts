import type { Resource } from '@package/database'

export enum OrganizationEventName {
	MEMBER_JOINED = 'member-joined',
	MEMBER_LEFT = 'member-left',
	ORGANIZATION_CREATED = 'organization-created'
}

export interface OrganizationEvent extends Resource {
	name: OrganizationEventName
	payload: unknown // TBD
}
