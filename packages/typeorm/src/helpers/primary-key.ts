import type { KeyOf, NonEmptyArray } from '@package/core'
import type { ObjectLiteral, ObjectType } from 'typeorm'

export const primaryKeys = new Map<ObjectType<unknown> | string, string[]>()

/**
 * Configure primary key fields for an entity
 */
export const setPrimaryKeyColumns = <T extends ObjectLiteral>(
	entity: ObjectType<T>,
	columns: Array<KeyOf<T>>
): void => {
	if (columns.length === 0) {
		throw new Error(`Keys should be a non empty array of string.`)
	}
	primaryKeys.set(entity, [...columns])
}

/**
 * Get configured primary key for an entity
 */
export const getPrimaryKeyColumns = <T extends ObjectLiteral>(entity: ObjectType<T>): NonEmptyArray<KeyOf<T>> => {
	const columns = primaryKeys.get(entity)
	if (!columns) {
		throw new Error(`Primary key is not configured for ${entity.name}`)
	}
	if (!columns.length) {
		throw new Error(`Primary key should contain one to many columns.`)
	}
	return columns as NonEmptyArray<KeyOf<T>>
}
