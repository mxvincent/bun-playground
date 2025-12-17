import type { KeyOf } from '@package/core'
import {
	ArrayComparisonFilter,
	type ComparisonFilter,
	ComparisonOperator,
	type Filter,
	FilterType,
	type LogicalFilter,
	LogicalOperator,
	NullComparisonFilter,
	ValueComparisonFilter
} from '@package/query-params'

const normalizeValue = (value: unknown): string | undefined => {
	switch (typeof value) {
		case 'string':
			return value
		case 'number':
		case 'bigint':
			return String(value)
		case 'object':
			if (value instanceof Date) {
				return value.toISOString()
			}

			break
	}
	return undefined
}

/**
 * Apply a comparison filter to a single item
 */
function applyComparisonFilter<T extends object>(filter: ComparisonFilter<KeyOf<T>>, item: T): boolean {
	const value = normalizeValue(item[filter.path])

	// Null comparison filters
	if (filter instanceof NullComparisonFilter) {
		switch (filter.operator) {
			case ComparisonOperator.NULL:
				return value === null || value === undefined
			case ComparisonOperator.NOT_NULL:
				return value !== null && value !== undefined
		}
	}

	// Array comparison filters
	if (filter instanceof ArrayComparisonFilter) {
		// const stringValue = serializeFilterValue(value)
		switch (filter.operator) {
			case ComparisonOperator.IN:
				return value !== undefined && filter.values.includes(value)
			case ComparisonOperator.NOT_IN:
				return value === undefined || !filter.values.includes(value)
		}
	}

	// Value comparison filters
	if (filter instanceof ValueComparisonFilter) {
		const filterValue = filter.value

		switch (filter.operator) {
			case ComparisonOperator.EQUAL:
				return value === filterValue
			case ComparisonOperator.NOT_EQUAL:
				return value !== filterValue
			case ComparisonOperator.LESS_THAN:
				return value !== undefined && value < filterValue
			case ComparisonOperator.LESS_THAN_OR_EQUAL:
				return value !== undefined && value <= filterValue
			case ComparisonOperator.GREATER_THAN:
				return value !== undefined && value > filterValue
			case ComparisonOperator.GREATER_THAN_OR_EQUAL:
				return value !== undefined && value >= filterValue
			case ComparisonOperator.LIKE:
				return value?.includes(filterValue) ?? false
			case ComparisonOperator.NOT_LIKE:
				return value === undefined || !value.includes(filterValue)
			case ComparisonOperator.MATCH:
				if (value === undefined) return false
				try {
					const regex = new RegExp(filterValue)
					return regex.test(value)
				} catch {
					return false
				}
			case ComparisonOperator.INSENSITIVE_MATCH:
				if (!value) return false
				try {
					const regex = new RegExp(filterValue, 'i')
					return regex.test(value)
				} catch {
					return false
				}
		}
	}

	return false
}

/**
 * Apply a logical filter to a single item
 */
function applyLogicalFilter<T extends object>(filter: LogicalFilter<KeyOf<T>>, item: T): boolean {
	switch (filter.operator) {
		case LogicalOperator.AND:
			return filter.filters.every((f) => applyFilter(f, item))
		case LogicalOperator.OR:
			return filter.filters.some((f) => applyFilter(f, item))
	}
}

/**
 * Apply any filter to a single item
 */
function applyFilter<T extends object>(filter: Filter<KeyOf<T>>, item: T): boolean {
	if (filter.type === FilterType.LOGICAL) {
		return applyLogicalFilter<T>(filter, item)
	}
	return applyComparisonFilter<T>(filter, item)
}

/**
 * Filter an array using a list of filters (all filters are combined with AND)
 * Now with better type inference for the filter paths
 */
export function filterArrayWith<T extends object>(array: T[], filters: Filter<KeyOf<T>>[]): T[] {
	if (filters.length === 0) {
		return array
	}

	return array.filter((item) => filters.every((filter) => applyFilter(filter, item)))
}
