import { describe, expect, it } from 'bun:test'
import {
	ArrayComparisonFilter,
	ComparisonFilter,
	LogicalFilter,
	NullComparisonFilter,
	ValueComparisonFilter
} from './filters'
import { ComparisonOperator, LogicalOperator } from './operators'

describe('ComparisonFilter factories', () => {
	it.each([
		[ComparisonFilter.equal, ComparisonOperator.EQUAL],
		[ComparisonFilter.notEqual, ComparisonOperator.NOT_EQUAL],
		[ComparisonFilter.lessThan, ComparisonOperator.LESS_THAN],
		[ComparisonFilter.lessThanOrEqual, ComparisonOperator.LESS_THAN_OR_EQUAL],
		[ComparisonFilter.greaterThan, ComparisonOperator.GREATER_THAN],
		[ComparisonFilter.greaterThanOrEqual, ComparisonOperator.GREATER_THAN_OR_EQUAL],
		[ComparisonFilter.like, ComparisonOperator.LIKE],
		[ComparisonFilter.notLike, ComparisonOperator.NOT_LIKE],
		[ComparisonFilter.match, ComparisonOperator.MATCH],
		[ComparisonFilter.insensitiveMatch, ComparisonOperator.INSENSITIVE_MATCH]
	] as const)('creates a value filter with the %p operator', (factory, operator) => {
		expect(factory('path', 'value')).toStrictEqual(new ValueComparisonFilter(operator, 'path', 'value'))
	})

	it.each([
		[ComparisonFilter.in, ComparisonOperator.IN],
		[ComparisonFilter.notIn, ComparisonOperator.NOT_IN]
	] as const)('creates an array filter with the %p operator', (factory, operator) => {
		expect(factory('path', ['a'])).toStrictEqual(new ArrayComparisonFilter(operator, 'path', ['a']))
	})

	it.each([
		[ComparisonFilter.null, ComparisonOperator.NULL],
		[ComparisonFilter.notNull, ComparisonOperator.NOT_NULL]
	] as const)('creates a null filter with the %p operator', (factory, operator) => {
		expect(factory('path')).toStrictEqual(new NullComparisonFilter(operator, 'path'))
	})
})

describe('LogicalFilter factories', () => {
	const filters = [ComparisonFilter.null('path')]

	it.each([
		[LogicalFilter.and, LogicalOperator.AND],
		[LogicalFilter.or, LogicalOperator.OR]
	] as const)('creates a logical filter with the %p operator', (factory, operator) => {
		expect(factory(filters)).toStrictEqual(new LogicalFilter(operator, filters))
	})
})

describe('toJSON()', () => {
	it('serializes a value filter', () => {
		expect<unknown>(ComparisonFilter.equal('path', 'a').toJSON()).toStrictEqual({
			type: 'comparison',
			operator: 'equal',
			path: 'path',
			value: 'a'
		})
	})

	it('serializes an array filter', () => {
		expect<unknown>(ComparisonFilter.in('path', ['a']).toJSON()).toStrictEqual({
			type: 'comparison',
			operator: 'in',
			path: 'path',
			values: ['a']
		})
	})

	it('serializes a null filter', () => {
		expect<unknown>(ComparisonFilter.null('path').toJSON()).toStrictEqual({
			type: 'comparison',
			operator: 'null',
			path: 'path'
		})
	})

	it('serializes the nested filters of a logical filter', () => {
		expect<unknown>(LogicalFilter.or([ComparisonFilter.null('path')]).toJSON()).toStrictEqual({
			type: 'logical',
			operator: 'or',
			filters: [{ type: 'comparison', operator: 'null', path: 'path' }]
		})
	})
})
