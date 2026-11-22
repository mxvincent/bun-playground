import type { KeyOf, NonEmptyArray } from '@package/core'
import type { ObjectLiteral, ObjectType } from 'typeorm'
import { TypeormInvalidPrimaryKeyError } from '../errors/invalid-primary-key'
import { TypeormPrimaryKeyNotConfiguredError } from '../errors/primary-key-not-configured'

export const primaryKeys = new Map<ObjectType<unknown> | string, string[]>()

/**
 * Configure primary key fields for an entity
 */
export const setPrimaryKeyColumns = <T extends ObjectLiteral>(
	entity: ObjectType<T>,
	columns: Array<KeyOf<T>>
): void => {
	if (columns.length === 0) {
		throw new TypeormInvalidPrimaryKeyError(entity.name, 'Keys should be a non empty array of string.')
	}
	primaryKeys.set(entity, [...columns])
}

/**
 * Get configured primary key for an entity
 */
export const getPrimaryKeyColumns = <T extends ObjectLiteral>(entity: ObjectType<T>): NonEmptyArray<KeyOf<T>> => {
	const columns = primaryKeys.get(entity)
	if (!columns) {
		throw new TypeormPrimaryKeyNotConfiguredError(entity.name)
	}
	if (!columns.length) {
		throw new TypeormInvalidPrimaryKeyError(entity.name, 'Primary key should contain one to many columns.')
	}
	return columns as NonEmptyArray<KeyOf<T>>
}
