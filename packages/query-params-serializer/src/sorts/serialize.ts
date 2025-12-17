import type { Sort } from '@package/query-params'
import { encodeSortDirection } from './transformers'

export const serializeSort = (sort: Sort) => {
	return `${encodeSortDirection(sort.direction)}(${sort.path})`
}

export const serializeSorts = (sorts: Sort[]) => {
	return sorts.map(serializeSort)
}
