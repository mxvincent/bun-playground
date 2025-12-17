import { faker } from '@faker-js/faker'
import { generateUUID } from '@package/core'
import type { Editable, Resource } from '../interfaces/resource'

export function generateResource(values: Partial<Resource & Editable>): Resource & Editable {
	const createdAt =
		values.createdAt ??
		faker.date.between({
			from: new Date('2020-01-01T00:00:00Z'),
			to: new Date()
		})
	return {
		id: values.id ?? generateUUID(),
		createdAt,
		updatedAt: values.updatedAt ?? faker.date.between({ from: createdAt, to: new Date() })
	}
}

export const generateIso8601 = (date = new Date()) => date.toISOString()
