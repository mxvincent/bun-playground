import { describe, expect, it } from 'bun:test'
import { arrayComparisonFilter, logicalFilter, nullComparisonFilter, valueComparisonFilter } from './factories'
import { ComparisonFilter, type Filter } from './filters'
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

describe('Filter guards', () => {
	describe('isComparisonFilter()', () => {
		describe('should return true', () => {
			it.each<Filter>([
				...ARRAY_COMPARISON_OPERATORS.map(arrayComparisonFilter).map((factory) => factory('key', ['a', 'b', 'c'])),
				...NULL_COMPARISON_OPERATORS.map(nullComparisonFilter).map((factory) => factory('key')),
				...VALUE_COMPARISON_OPERATORS.map(valueComparisonFilter).map((factory) => factory('key', 'value'))
			])('filter: $operator', (value) => {
				expect(isComparisonFilter(value)).toBeTruthy()
			})
		})
		describe('should return false', () => {
			it.each<Filter>(
				LOGICAL_OPERATORS.map(logicalFilter).map((factory) =>
					factory([ComparisonFilter.null('a'), ComparisonFilter.null('b')])
				)
			)('filter: $operator', (value) => {
				expect(isComparisonFilter(value)).toBeFalsy()
			})
			it('should handle null', () => {
				expect(isComparisonFilter(null)).toBeFalsy()
			})
			it('should handle array', () => {
				expect(isComparisonFilter([])).toBeFalsy()
			})
			it('should handle object', () => {
				expect(isComparisonFilter({})).toBeFalsy()
			})
			it('should handle string', () => {
				expect(isComparisonFilter('a')).toBeFalsy()
			})
			it('should handle number', () => {
				expect(isComparisonFilter(1)).toBeFalsy()
			})
			it('should handle undefined', () => {
				expect(isComparisonFilter(undefined)).toBeFalsy()
			})
		})
	})

	describe('isArrayComparisonFilter()', () => {
		describe('should return true', () => {
			it.each<Filter>(
				ARRAY_COMPARISON_OPERATORS.map(arrayComparisonFilter).map((factory) => factory('key', ['a', 'b', 'c']))
			)('filter: $operator', (value) => {
				expect(isArrayComparisonFilter(value)).toBeTruthy()
			})
		})
		describe('should return false', () => {
			it.each<Filter>([
				...LOGICAL_OPERATORS.map(logicalFilter).map((factory) =>
					factory([ComparisonFilter.null('a'), ComparisonFilter.null('b')])
				),
				...NULL_COMPARISON_OPERATORS.map(nullComparisonFilter).map((factory) => factory('key')),
				...VALUE_COMPARISON_OPERATORS.map(valueComparisonFilter).map((factory) => factory('key', 'value'))
			])('filter: $operator', (value) => {
				expect(isArrayComparisonFilter(value)).toBeFalsy()
			})
			it('should handle null', () => {
				expect(isArrayComparisonFilter(null)).toBeFalsy()
			})
			it('should handle array', () => {
				expect(isArrayComparisonFilter([])).toBeFalsy()
			})
			it('should handle object', () => {
				expect(isArrayComparisonFilter({})).toBeFalsy()
			})
			it('should handle string', () => {
				expect(isArrayComparisonFilter('a')).toBeFalsy()
			})
			it('should handle number', () => {
				expect(isArrayComparisonFilter(1)).toBeFalsy()
			})
			it('should handle undefined', () => {
				expect(isArrayComparisonFilter(undefined)).toBeFalsy()
			})
		})
	})

	describe('isNullComparisonFilter()', () => {
		describe('should return true', () => {
			it.each<Filter>(
				NULL_COMPARISON_OPERATORS.map(nullComparisonFilter).map((factory) => factory('key'))
			)('filter: $operator', (value) => {
				expect(isNullComparisonFilter(value)).toBeTruthy()
			})
		})
		describe('should return false', () => {
			it.each<Filter>([
				...LOGICAL_OPERATORS.map(logicalFilter).map((factory) =>
					factory([ComparisonFilter.null('a'), ComparisonFilter.null('b')])
				),
				...ARRAY_COMPARISON_OPERATORS.map(arrayComparisonFilter).map((factory) => factory('key', ['a', 'b', 'c'])),
				...VALUE_COMPARISON_OPERATORS.map(valueComparisonFilter).map((factory) => factory('key', 'value'))
			])('filter: $operator', (value) => {
				expect(isNullComparisonFilter(value)).toBeFalsy()
			})
			it('should handle null', () => {
				expect(isNullComparisonFilter(null)).toBeFalsy()
			})
			it('should handle array', () => {
				expect(isNullComparisonFilter([])).toBeFalsy()
			})
			it('should handle object', () => {
				expect(isNullComparisonFilter({})).toBeFalsy()
			})
			it('should handle string', () => {
				expect(isNullComparisonFilter('a')).toBeFalsy()
			})
			it('should handle number', () => {
				expect(isNullComparisonFilter(1)).toBeFalsy()
			})
			it('should handle undefined', () => {
				expect(isNullComparisonFilter(undefined)).toBeFalsy()
			})
		})
	})

	describe('isValueComparisonFilter()', () => {
		describe('should return true', () => {
			it.each<Filter>(
				VALUE_COMPARISON_OPERATORS.map(valueComparisonFilter).map((factory) => factory('key', 'value'))
			)('filter: $operator', (value) => {
				expect(isValueComparisonFilter(value)).toBeTruthy()
			})
		})
		describe('should return false', () => {
			it.each<Filter>([
				...LOGICAL_OPERATORS.map(logicalFilter).map((factory) =>
					factory([ComparisonFilter.null('a'), ComparisonFilter.null('b')])
				),
				...NULL_COMPARISON_OPERATORS.map(nullComparisonFilter).map((factory) => factory('key')),
				...ARRAY_COMPARISON_OPERATORS.map(arrayComparisonFilter).map((factory) => factory('key', ['a', 'b', 'c']))
			])('filter: $operator', (value) => {
				expect(isValueComparisonFilter(value)).toBeFalsy()
			})
			it('should handle null', () => {
				expect(isValueComparisonFilter(null)).toBeFalsy()
			})
			it('should handle array', () => {
				expect(isValueComparisonFilter([])).toBeFalsy()
			})
			it('should handle object', () => {
				expect(isValueComparisonFilter({})).toBeFalsy()
			})
			it('should handle string', () => {
				expect(isValueComparisonFilter('a')).toBeFalsy()
			})
			it('should handle number', () => {
				expect(isValueComparisonFilter(1)).toBeFalsy()
			})
			it('should handle undefined', () => {
				expect(isValueComparisonFilter(undefined)).toBeFalsy()
			})
		})
	})

	describe('isLogicalFilter()', () => {
		describe('should return true', () => {
			it.each<Filter>(
				LOGICAL_OPERATORS.map(logicalFilter).map((factory) =>
					factory([ComparisonFilter.null('a'), ComparisonFilter.null('b')])
				)
			)('filter: $operator', (value) => {
				expect(isLogicalFilter(value)).toBeTruthy()
			})
		})
		describe('should return false', () => {
			it.each<Filter>([
				...ARRAY_COMPARISON_OPERATORS.map(arrayComparisonFilter).map((factory) => factory('key', ['a', 'b', 'c'])),
				...NULL_COMPARISON_OPERATORS.map(nullComparisonFilter).map((factory) => factory('key')),
				...VALUE_COMPARISON_OPERATORS.map(valueComparisonFilter).map((factory) => factory('key', 'value'))
			])('filter: $operator', (filter) => {
				expect(isLogicalFilter(filter)).toBeFalsy()
			})
			it('should handle null', () => {
				expect(isLogicalFilter(null)).toBeFalsy()
			})
			it('should handle array', () => {
				expect(isLogicalFilter([])).toBeFalsy()
			})
			it('should handle object', () => {
				expect(isLogicalFilter({})).toBeFalsy()
			})
			it('should handle string', () => {
				expect(isLogicalFilter('a')).toBeFalsy()
			})
			it('should handle number', () => {
				expect(isLogicalFilter(1)).toBeFalsy()
			})
			it('should handle undefined', () => {
				expect(isLogicalFilter(undefined)).toBeFalsy()
			})
		})
	})

	describe('isFilter()', () => {
		describe('should return true', () => {
			it.each<Filter>([
				...ARRAY_COMPARISON_OPERATORS.map(arrayComparisonFilter).map((factory) => factory('key', ['a', 'b', 'c'])),
				...NULL_COMPARISON_OPERATORS.map(nullComparisonFilter).map((factory) => factory('key')),
				...VALUE_COMPARISON_OPERATORS.map(valueComparisonFilter).map((factory) => factory('key', 'value')),
				...LOGICAL_OPERATORS.map(logicalFilter).map((factory) =>
					factory([ComparisonFilter.null('a'), ComparisonFilter.null('b')])
				)
			])('filter: $operator', (value) => {
				expect(isFilter(value)).toBeTruthy()
			})
		})
		describe('should return false', () => {
			it('should handle null', () => {
				expect(isFilter(null)).toBeFalsy()
			})
			it('should handle array', () => {
				expect(isFilter([])).toBeFalsy()
			})
			it('should handle object', () => {
				expect(isFilter({})).toBeFalsy()
			})
			it('should handle string', () => {
				expect(isFilter('a')).toBeFalsy()
			})
			it('should handle number', () => {
				expect(isFilter(1)).toBeFalsy()
			})
			it('should handle undefined', () => {
				expect(isFilter(undefined)).toBeFalsy()
			})
		})
	})
})

describe('Operator guards', () => {
	describe('isArrayComparisonOperator()', () => {
		describe('should return true', () => {
			it.each([...ARRAY_COMPARISON_OPERATORS])('%s', (value) => {
				expect(isArrayComparisonOperator(value)).toBeTruthy()
			})
		})

		describe('should return false', () => {
			it.each([...VALUE_COMPARISON_OPERATORS, ...LOGICAL_OPERATORS, ...NULL_COMPARISON_OPERATORS])('%s', (value) => {
				expect(isArrayComparisonOperator(value)).toBeFalsy()
			})
		})
	})

	describe('isNullComparisonOperator()', () => {
		describe('should return true', () => {
			it.each([...NULL_COMPARISON_OPERATORS])('%s', (value) => {
				expect(isNullComparisonOperator(value)).toBeTruthy()
			})
		})

		describe('should return false', () => {
			it.each([...ARRAY_COMPARISON_OPERATORS, ...LOGICAL_OPERATORS, ...VALUE_COMPARISON_OPERATORS])('%s', (value) => {
				expect(isNullComparisonOperator(value)).toBeFalsy()
			})
		})
	})

	describe('isValueComparisonOperator()', () => {
		describe('should return true', () => {
			it.each([...VALUE_COMPARISON_OPERATORS])('%s', (value) => {
				expect(isValueComparisonOperator(value)).toBeTruthy()
			})
		})

		describe('should return false', () => {
			it.each([...ARRAY_COMPARISON_OPERATORS, ...LOGICAL_OPERATORS, ...NULL_COMPARISON_OPERATORS])('%s', (value) => {
				expect(isValueComparisonOperator(value)).toBeFalsy()
			})
		})
	})

	describe('isLogicalOperator()', () => {
		describe('should return true', () => {
			it.each([...LOGICAL_OPERATORS])('%s', (value) => {
				expect(isLogicalOperator(value)).toBeTruthy()
			})
		})

		describe('should return false', () => {
			it.each([
				...ARRAY_COMPARISON_OPERATORS,
				...NULL_COMPARISON_OPERATORS,
				...NULL_COMPARISON_OPERATORS
			])('%s', (value) => {
				expect(isLogicalOperator(value)).toBeFalsy()
			})
		})
	})
})
