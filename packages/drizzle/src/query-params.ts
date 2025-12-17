import { invariant } from '@package/core'
import {
	ComparisonOperator,
	type Filter,
	isArrayComparisonFilter,
	isLogicalFilter,
	isNullComparisonFilter,
	isValueComparisonFilter,
	LogicalOperator,
	Pagination,
	type Sort
} from '@package/query-params'
import { parseFilters, parseSorts, QueryStringParameterValidationError } from '@package/query-params-serializer'
import type { PgColumn } from 'drizzle-orm/pg-core'
import * as SQLCondition from 'drizzle-orm/sql/expressions/conditions'
import type { SQL } from 'drizzle-orm/sql/sql'

export type ColumnMapping<T extends string = string> = Record<T, PgColumn>

export const isMappedColumn = <Key extends string>(
	sort: Sort,
	columnAliases: ColumnMapping<Key>
): sort is Sort<Key> => {
	return sort.path in columnAliases
}

export const validateSort = <Key extends string>(sort: Sort, columnMapping: ColumnMapping<Key>): Sort<Key> => {
	if (!isMappedColumn(sort, columnMapping)) {
		throw new QueryStringParameterValidationError('Invalid sort', [sort.toString()])
	}
	return sort as Sort<Key>
}

export const validateSorts = <Key extends string>(sorts: Sort[], columnMapping: ColumnMapping<Key>): Sort<Key>[] => {
	const invalidSorts = sorts.filter((sort) => !isMappedColumn(sort, columnMapping))
	if (invalidSorts.length) {
		throw new QueryStringParameterValidationError(
			'Invalid sort',
			invalidSorts.map((sort) => sort.toString())
		)
	}
	return sorts as Sort<Key>[]
}

export const transformFilter = <Key extends string>(filter: Filter<Key>, columns: ColumnMapping<Key>): SQL => {
	if (isLogicalFilter(filter)) {
		switch (filter.operator) {
			case LogicalOperator.AND:
				return SQLCondition.and(...filter.filters.map((filter) => transformFilter(filter, columns))) as SQL
			case LogicalOperator.OR:
				return SQLCondition.or(...filter.filters.map((filter) => transformFilter(filter, columns))) as SQL
		}
	}
	const column = invariant(columns[filter.path])
	if (isValueComparisonFilter(filter)) {
		switch (filter.operator) {
			case ComparisonOperator.EQUAL:
				return SQLCondition.eq(column, filter.value)
			case ComparisonOperator.NOT_EQUAL:
				return SQLCondition.ne(column, filter.value)
			case ComparisonOperator.GREATER_THAN:
				return SQLCondition.gt(column, filter.value)
			case ComparisonOperator.GREATER_THAN_OR_EQUAL:
				return SQLCondition.gte(column, filter.value)
			case ComparisonOperator.LESS_THAN:
				return SQLCondition.lt(column, filter.value)
			case ComparisonOperator.LESS_THAN_OR_EQUAL:
				return SQLCondition.lte(column, filter.value)
			case ComparisonOperator.LIKE:
				return SQLCondition.like(column, filter.value)
			case ComparisonOperator.NOT_LIKE:
				return SQLCondition.notLike(column, filter.value)
		}
	}
	if (isArrayComparisonFilter(filter)) {
		switch (filter.operator) {
			case ComparisonOperator.IN:
				return SQLCondition.inArray(column, filter.values)
			case ComparisonOperator.NOT_IN:
				return SQLCondition.notInArray(column, filter.values)
		}
	}
	if (isNullComparisonFilter(filter)) {
		switch (filter.operator) {
			case ComparisonOperator.NULL:
				return SQLCondition.isNull(column)
			case ComparisonOperator.NOT_NULL:
				return SQLCondition.isNotNull(column)
		}
	}
	throw new Error('Filter is not configured')
}
export const transformFilters = <Key extends string>(
	filters: Filter<Key>[] | undefined,
	columnMapping: ColumnMapping<Key>
): SQL[] => {
	return filters ? filters.map((filter) => transformFilter(filter, columnMapping)) : []
}

const validateFilters = <Key extends string>(filters: Filter[], columns: ColumnMapping<Key>): Filter<Key>[] => {
	for (const filter of filters) {
		if (isLogicalFilter(filter)) {
			validateFilters(filter.filters, columns)
		} else {
			if (filter.path in columns) {
				continue
			}
			throw new QueryStringParameterValidationError('Invalid filter', [filter.toString()])
		}
	}
	return filters as Filter<Key>[]
}

export const parseAndValidateQueryParameters = <Key extends string>(
	query: {
		sorts?: string | string[]
		filters?: string | string[]
		size?: number
		after?: string
		before?: string
	},
	options: {
		defaultSort: Sort<Key>
		defaultPaginationSize: number
		columnMapping: ColumnMapping<Key>
	}
): {
	pagination: Pagination
	filters: Filter<Key>[]
	sorts: Sort<Key>[]
} => {
	const filters = parseFilters(query.filters ?? [])
	const sorts = query.sorts ? parseSorts(query.sorts) : [options.defaultSort]
	return {
		pagination: Pagination.take(query.size ?? options.defaultPaginationSize, query.after),
		filters: validateFilters(filters, options.columnMapping),
		sorts: validateSorts(sorts, options.columnMapping)
	}
}
