import { expect, it } from 'bun:test'
import {
	ARRAY_COMPARISON_OPERATORS,
	ArrayComparisonFilter,
	ComparisonFilter,
	type Filter,
	LOGICAL_OPERATORS,
	LogicalFilter,
	NULL_COMPARISON_OPERATORS,
	NullComparisonFilter,
	VALUE_COMPARISON_OPERATORS,
	ValueComparisonFilter
} from '@package/query-params'
import { parseFilters } from './parse'
import { serializeFilters } from './serialize'

// Values hold the characters the format uses as separators
const FILTERS: Filter[] = [
	...VALUE_COMPARISON_OPERATORS.map((operator) => new ValueComparisonFilter(operator, 'path', 'a,b %')),
	...ARRAY_COMPARISON_OPERATORS.map((operator) => new ArrayComparisonFilter(operator, 'path', ['a,b', 'c'])),
	...NULL_COMPARISON_OPERATORS.map((operator) => new NullComparisonFilter(operator, 'path')),
	...LOGICAL_OPERATORS.map(
		(operator) => new LogicalFilter(operator, [ComparisonFilter.null('a'), ComparisonFilter.null('b')])
	)
]

it.each(
	FILTERS.map((filter) => [filter.operator, filter])
)('parses back a serialized %s filter', (_operator, filter) => {
	expect(parseFilters(serializeFilters([filter]))).toStrictEqual([filter])
})
