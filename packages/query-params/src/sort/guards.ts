import { SORT_DIRECTIONS, type Sort } from './sort'

/**
 * Sort type guard: accepts Sort instances and objects with a direction and a path
 */
export const isSort = (value: unknown): value is Sort => {
	if (typeof value !== 'object' || value === null) {
		return false
	}
	const { direction, path } = value as Partial<Sort>
	return SORT_DIRECTIONS.includes(direction as never) && typeof path === 'string'
}
