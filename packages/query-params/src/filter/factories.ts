import { ArrayComparisonFilter, LogicalFilter, NullComparisonFilter, ValueComparisonFilter } from './filters'

/**
 * Create an ArrayComparisonFilter factory
 */
export function arrayComparisonFilter(operator: ArrayComparisonFilter['operator']) {
	return <T extends string>(path: T, values: string[]) => new ArrayComparisonFilter<T>(operator, path, values)
}

/**
 * Create a NullComparisonFilter factory
 */
export function nullComparisonFilter(operator: NullComparisonFilter['operator']) {
	return <T extends string>(path: T) => new NullComparisonFilter<T>(operator, path)
}

/**
 * Create a ValueComparisonFilter factory
 */
export function valueComparisonFilter(operator: ValueComparisonFilter['operator']) {
	return <T extends string>(path: T, value: string) => new ValueComparisonFilter<T>(operator, path, value)
}

/**
 * Create a LogicalFilter factory
 */
export function logicalFilter(operator: LogicalFilter['operator']) {
	return <T extends string>(filters: LogicalFilter<T>['filters']) => new LogicalFilter<T>(operator, filters)
}
