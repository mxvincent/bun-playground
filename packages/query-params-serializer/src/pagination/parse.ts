import { Pagination } from '@package/query-params'
import { isString } from 'es-toolkit'
import type { QueryStringRecord } from '../types/query-string'

const normalizeValue = (value?: string | string[]): string | undefined => {
	const unwrappedValue = Array.isArray(value) ? value[0] : value
	return isString(unwrappedValue) && unwrappedValue.length > 0 ? unwrappedValue : undefined
}

export const parsePagination = (
	queryStringRecord: QueryStringRecord,
	options?: {
		defaultPageSize?: number
	}
): Pagination => {
	const take = normalizeValue(queryStringRecord['take'])
	const after = normalizeValue(queryStringRecord['after'])
	const itemsPerPage = isString(take)
		? Number(take)
		: options?.defaultPageSize
			? options.defaultPageSize
			: Pagination.DEFAULT_PAGE_SIZE
	return Pagination.take(itemsPerPage, after)
}
