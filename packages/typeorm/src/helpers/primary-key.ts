import type { KeyOf, NonEmptyArray } from '@package/core'
import type { Sort } from '@package/query-params'
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

export const defaultSort = new Map<ObjectType<unknown>, Sort[]>()

type EntitySort<T extends ObjectLiteral> = Sort<KeyOf<T>>

export const setDefaultSort = <T extends ObjectLiteral>(entity: ObjectType<T>, sorts: EntitySort<T>[]): void => {
	defaultSort.set(entity, sorts as Sort[])
}

export const getDefaultSort = <T extends ObjectLiteral>(entity: ObjectType<T>): EntitySort<T>[] => {
	return (defaultSort.get(entity) ?? []) as EntitySort<T>[]
}

export const appendPrimaryKeySorts = <T extends ObjectLiteral>(
	sorts: EntitySort<T>[],
	primaryKeyColumns: NonEmptyArray<KeyOf<T>>
): NonEmptyArray<EntitySort<T>> => {
	return [
		...sorts,
		...primaryKeyColumns
			.filter((column) => !sorts.find((sort) => sort.path === column))
			.map((column) => ({ path: column, direction: 'asc' }))
	] as NonEmptyArray<EntitySort<T>>
}
