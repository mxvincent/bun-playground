import { uniq } from 'es-toolkit'
import { type ComparisonFilter, type Filter, LogicalFilter } from './filters'
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
 * Remove the filters identical to a previous one (same operator, path and value), at every level.
 * Keep the order of the filters, and return new logical filters instead of mutating the given ones.
 */
export const removeDuplicatedFilters = <T extends string>(filters: Filter<T>[]): Filter<T>[] => {
	const seen = new Set<string>()
	return filters.flatMap((filter) => {
		const deduplicated = isLogicalFilter(filter)
			? new LogicalFilter<T>(filter.operator, removeDuplicatedFilters(filter.filters))
			: filter
		const key = JSON.stringify(deduplicated.toJSON())
		if (seen.has(key)) {
			return []
		}
		seen.add(key)
		return [deduplicated]
	})
}
