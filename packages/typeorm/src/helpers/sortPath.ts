import type { KeyOf, NonEmptyArray } from '@package/core'
import { Sort } from '@package/query-params'
import invariant from 'tiny-invariant'
import type { ObjectLiteral, ObjectType } from 'typeorm'

export const defaultSort = new Map<ObjectType<unknown>, Sort[]>()

type EntitySort<T extends ObjectLiteral> = Sort<KeyOf<T>>

export const setDefaultSort = <T extends ObjectLiteral>(entity: ObjectType<T>, sorts: EntitySort<T>[]): void => {
	defaultSort.set(entity, sorts as Sort[])
}

export const getDefaultSort = <T extends ObjectLiteral>(entity: ObjectType<T>): EntitySort<T>[] => {
	return (defaultSort.get(entity) ?? []) as EntitySort<T>[]
}

export const mergePrimaryKeySorts = <T extends ObjectLiteral>(
	sorts: EntitySort<T>[],
	primaryKeyColumns: NonEmptyArray<KeyOf<T>>
): NonEmptyArray<EntitySort<T>> => {
	invariant(primaryKeyColumns[0], `Argument primaryKeyColumns should be a non empty array`)
	const primaryKeySorts = primaryKeyColumns
		.filter((column) => !sorts.find((sort) => sort.path === column))
		.map((column) => Sort.asc(column))
	return [...sorts, ...primaryKeySorts] as NonEmptyArray<EntitySort<T>>
}

/**
 * Return path if already prefixed or use fallback alias as prefix
 */
export const getAliasedPath = (path: string, fallbackAlias: string) => {
	return path.includes('.') ? path : `${fallbackAlias}.${path}`
}
