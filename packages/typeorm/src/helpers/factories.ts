import { randomUUID } from 'node:crypto'
import type { DeletableResource, Resource } from './entities'

export const resourceFactory = (options?: Partial<Resource>): Resource => {
	const createdAt = options?.createdAt ?? new Date()
	return {
		id: options?.id ?? randomUUID(),
		createdAt,
		updatedAt: options?.updatedAt ?? createdAt
	}
}

export const deletableResourceFactory = (options?: Partial<DeletableResource>): DeletableResource => {
	return Object.assign(resourceFactory(options), {
		deletedAt: options?.deletedAt ?? null
	})
}
