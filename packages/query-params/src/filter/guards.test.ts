import { describe, expect, it } from 'bun:test'
import { ComparisonFilter, LogicalFilter } from './filters'
import {
	isArrayComparisonFilter,
	isArrayComparisonOperator,
	isComparisonFilter,
	isFilter,
	isLogicalFilter,
	isLogicalOperator,
	isNullComparisonFilter,
	isNullComparisonOperator,
	isValueComparisonFilter,
	isValueComparisonOperator
} from './guards'
import {
	ARRAY_COMPARISON_OPERATORS,
	LOGICAL_OPERATORS,
	NULL_COMPARISON_OPERATORS,
	VALUE_COMPARISON_OPERATORS
} from './operators'

const FILTERS = {
	array: ComparisonFilter.in('key', ['a']),
	null: ComparisonFilter.null('key'),
	value: ComparisonFilter.equal('key', 'a'),
	logical: LogicalFilter.and([ComparisonFilter.null('key')])
}

// A plain object shaped like a filter is not a filter: guards check the class
const NOT_FILTERS: [unknown][] = [[null], [{ type: 'comparison', operator: 'equal', path: 'key', value: 'a' }]]

describe.each<{ guard: (value: unknown) => boolean; accepted: string[] }>([
	{ guard: isArrayComparisonFilter, accepted: ['array'] },
	{ guard: isNullComparisonFilter, accepted: ['null'] },
	{ guard: isValueComparisonFilter, accepted: ['value'] },
	{ guard: isComparisonFilter, accepted: ['array', 'null', 'value'] },
	{ guard: isLogicalFilter, accepted: ['logical'] },
	{ guard: isFilter, accepted: ['array', 'null', 'value', 'logical'] }
])('$guard.name()', ({ guard, accepted }) => {
	it.each(Object.entries(FILTERS))('%s filter', (kind, filter) => {
		expect(guard(filter)).toBe(accepted.includes(kind))
	})

	it.each(NOT_FILTERS)('rejects %p', (value) => {
		expect(guard(value)).toBe(false)
	})
})

const OPERATORS = {
	array: ARRAY_COMPARISON_OPERATORS,
	null: NULL_COMPARISON_OPERATORS,
	value: VALUE_COMPARISON_OPERATORS,
	logical: LOGICAL_OPERATORS
}

describe.each<{ guard: (value: unknown) => boolean; accepted: string }>([
	{ guard: isArrayComparisonOperator, accepted: 'array' },
	{ guard: isNullComparisonOperator, accepted: 'null' },
	{ guard: isValueComparisonOperator, accepted: 'value' },
	{ guard: isLogicalOperator, accepted: 'logical' }
])('$guard.name()', ({ guard, accepted }) => {
	it.each(Object.entries(OPERATORS))('%s operators', (kind, operators) => {
		expect(operators.map(guard)).toStrictEqual(operators.map(() => kind === accepted))
	})

	it.each([[null], [1], ['unknown']])('rejects %p', (value) => {
		expect(guard(value)).toBe(false)
	})
})
