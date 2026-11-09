import {
	type Filter,
	isArrayComparisonFilter,
	isLogicalFilter,
	isNullComparisonFilter,
	isValueComparisonFilter
} from '@package/query-params'
import { encodeFilterOperator } from './transformers'
import { getFilterValueEncoding } from './value-encoding'

/**
 * Serialize a filter, encoding its values with the configured filter value encoding
 */
export const serializeFilter = (filter: Filter): string => {
	const { encode } = getFilterValueEncoding()
	if (isLogicalFilter(filter)) {
		const innerFilters = filter.filters.map((filter) => serializeFilter(filter)).join(',')
		return `${encodeFilterOperator(filter.operator)}(${innerFilters})`
	}
	if (isArrayComparisonFilter(filter)) {
		return `${encodeFilterOperator(filter.operator)}(${filter.path},${filter.values.map((value) => encode(value)).join(',')})`
	}
	if (isNullComparisonFilter(filter)) {
		return `${encodeFilterOperator(filter.operator)}(${filter.path})`
	}
	if (isValueComparisonFilter(filter)) {
		return `${encodeFilterOperator(filter.operator)}(${filter.path},${encode(filter.value)})`
	}
	throw new TypeError('Invalid filter')
}

export const serializeFilters = (filters: Filter[]): string[] => {
	return filters.map((filter) => serializeFilter(filter))
}
