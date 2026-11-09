import { Sort } from '@package/query-params'
import { isString } from 'es-toolkit'
import { decodeSortDirection } from './transformers'

const PATH = '[a-zA-Z0-9-_.]+'
/** `direction(path)`: the direction is only read in front of parentheses */
const SORT_WITH_DIRECTION = new RegExp(`^(?<direction>asc|desc)\\((?<path>${PATH})\\)$`)
/** `path`: ascending */
const SORT_WITHOUT_DIRECTION = new RegExp(`^(?<path>${PATH})$`)

const matchSort = (value: string): { direction: string; path: string } | undefined => {
	const withDirection = value.match(SORT_WITH_DIRECTION)?.groups
	if (withDirection?.direction && withDirection.path) {
		return { direction: withDirection.direction, path: withDirection.path }
	}
	const path = value.match(SORT_WITHOUT_DIRECTION)?.groups?.path
	return path ? { direction: 'asc', path } : undefined
}

/**
 * Parse sort params from parsed query string
 */
export const parseSorts = (sorts: string | string[], getFirstOnly?: boolean): Sort[] => {
	const sortParams: Required<Sort>[] = []
	const addSortParam = (str: string) => {
		const match = matchSort(str)
		if (match && sortParams.findIndex((el) => el.path === match.path) === -1) {
			sortParams.push(new Sort(decodeSortDirection(match.direction), match.path))
		}
	}
	if (isString(sorts)) {
		addSortParam(sorts)
	} else if (Array.isArray(sorts)) {
		for (const str of sorts.filter(isString)) {
			addSortParam(str)
			if (getFirstOnly) {
				break
			}
		}
	}
	return sortParams
}
