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
 * Compare an item value with a filter value, by the type of the item value:
 * numbers as numbers, dates as timestamps, strings as strings.
 * Returns undefined when the values cannot be compared (missing value, unparsable filter value).
 */
const compareValues = (value: unknown, filterValue: string): number | undefined => {
	const order = (a: number | bigint | string, b: number | bigint | string) => (a < b ? -1 : a > b ? 1 : 0)
	switch (typeof value) {
		case 'string':
			return order(value, filterValue)
		case 'number': {
			const parsed = Number(filterValue)
			return filterValue.trim() === '' || Number.isNaN(parsed) ? undefined : order(value, parsed)
		}
		case 'bigint':
			try {
				return order(value, BigInt(filterValue))
			} catch {
				return undefined
			}
		case 'object':
			if (value instanceof Date) {
				const parsed = Date.parse(filterValue)
				return Number.isNaN(parsed) ? undefined : order(value.getTime(), parsed)
			}
	}
	return undefined
}

const isEqualValue = (value: unknown, filterValue: string): boolean => compareValues(value, filterValue) === 0

/**
 * Apply a comparison filter to a single item
 */
function applyComparisonFilter<T extends object>(filter: ComparisonFilter<KeyOf<T>>, item: T): boolean {
	const rawValue = item[filter.path]
	const value = normalizeValue(rawValue)

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
		const isIncluded = filter.values.some((filterValue) => isEqualValue(rawValue, filterValue))
		switch (filter.operator) {
			case ComparisonOperator.IN:
				return value !== undefined && isIncluded
			case ComparisonOperator.NOT_IN:
				return value === undefined || !isIncluded
		}
	}

	// Value comparison filters
	if (filter instanceof ValueComparisonFilter) {
		const filterValue = filter.value
		const order = compareValues(rawValue, filterValue)

		switch (filter.operator) {
			case ComparisonOperator.EQUAL:
				return order === 0
			case ComparisonOperator.NOT_EQUAL:
				return order !== 0
			case ComparisonOperator.LESS_THAN:
				return order !== undefined && order < 0
			case ComparisonOperator.LESS_THAN_OR_EQUAL:
				return order !== undefined && order <= 0
			case ComparisonOperator.GREATER_THAN:
				return order !== undefined && order > 0
			case ComparisonOperator.GREATER_THAN_OR_EQUAL:
				return order !== undefined && order >= 0
			case ComparisonOperator.LIKE:
				return value?.includes(filterValue) ?? false
			case ComparisonOperator.NOT_LIKE:
				return value === undefined || !value.includes(filterValue)
			case ComparisonOperator.MATCH:
				if (value === undefined) {
					return false
				}
				try {
					const regex = new RegExp(filterValue)
					return regex.test(value)
				} catch {
					return false
				}
			case ComparisonOperator.INSENSITIVE_MATCH:
				if (!value) {
					return false
				}
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
