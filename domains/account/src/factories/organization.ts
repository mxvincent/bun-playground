import { randomStringGenerator } from '@package/core'
import { type Factory, generateResource } from '@package/database'
import type { Organization } from '../schemas/organization'

export const createOrganization: Factory<Organization> = (values = {}) => {
	return {
		...generateResource(values),
		deletedAt: values.deletedAt ?? null,
		name: values.name ?? `user-${randomStringGenerator.generate(8)}`
	}
}
