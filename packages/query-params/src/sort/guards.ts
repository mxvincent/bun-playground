import { isPlainObject } from 'es-toolkit'
import { SORT_DIRECTIONS, type Sort } from './sort'

/**
 * SortParams type guard
 */
export const isSort = (value: unknown): value is Sort => {
	return isPlainObject(value) && SORT_DIRECTIONS.includes(value.direction) && typeof value.path === 'string'
}
