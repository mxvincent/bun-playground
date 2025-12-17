import { uniq } from 'es-toolkit'
import type { ComparisonFilter, Filter, LogicalFilter } from './filters'
import { isComparisonFilter, isLogicalFilter } from './guards'

/**
 * Flatten comparison paths
 */
export const flattenComparisonPaths = (filters: (ComparisonFilter | LogicalFilter)[]): string[] => {
	return uniq(
		filters.flatMap((filter) => (isComparisonFilter(filter) ? [filter.path] : flattenComparisonPaths(filter.filters)))
	)
}

/**
 * Remove duplicated entries from filter params list
 * @param filters
 * TODO: handle different operator for a same path
 */
export const removeDuplicatedFilters = (filters: Filter[]): Filter[] => {
	const logicalFilters = filters.filter(isLogicalFilter)
	const comparisonFilters = filters.filter(isComparisonFilter)
	return [
		...comparisonFilters.filter(
			(filter, index) => comparisonFilters.findIndex(({ path }) => filter.path === path) === index
		),
		...logicalFilters.map((filter) =>
			Object.assign(filter, {
				filters: removeDuplicatedFilters(filter.filters)
			})
		)
	]
}
