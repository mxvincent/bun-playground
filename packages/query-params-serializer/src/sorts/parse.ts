import { Sort } from '@package/query-params'
import { isString } from 'es-toolkit'
import { decodeSortDirection } from './transformers'

/**
 * Parse sort params from parsed query string
 */
export const parseSorts = (sorts: string | string[], getFirstOnly?: boolean): Sort[] => {
	const sortParams: Required<Sort>[] = []
	const addSortParam = (str: string) => {
		const matches = str.match(/^(?<direction>asc|desc)?\(?(?<path>[a-zA-Z0-9-_.]+)\)?$/)
		if (matches) {
			const path = matches.groups?.path as string
			if (sortParams.findIndex((el) => el.path === path) === -1) {
				const direction = decodeSortDirection(matches.groups?.direction ?? 'asc')
				sortParams.push(new Sort(direction, path))
			}
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
