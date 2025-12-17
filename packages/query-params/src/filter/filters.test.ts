import { describe, expect, it } from 'bun:test'
import {
	ArrayComparisonFilter,
	ComparisonFilter,
	LogicalFilter,
	NullComparisonFilter,
	ValueComparisonFilter
} from './filters'
import { ComparisonOperator, LogicalOperator } from './operators'

describe('ArrayComparisonFilter', () => {
	it('should return "in" filter', () => {
		expect(ComparisonFilter.in('my.path', ['a', 'b', 'c'])).toStrictEqual(
			new ArrayComparisonFilter(ComparisonOperator.IN, 'my.path', ['a', 'b', 'c'])
		)
	})

	it('should return "notIn" filter', () => {
		expect(ComparisonFilter.notIn('my.path', ['a', 'b', 'c'])).toStrictEqual(
			new ArrayComparisonFilter(ComparisonOperator.NOT_IN, 'my.path', ['a', 'b', 'c'])
		)
	})
})

describe('NullComparisonFilter', () => {
	it('should return `Null` filter', () => {
		expect(ComparisonFilter.null('my.path')).toStrictEqual(new NullComparisonFilter(ComparisonOperator.NULL, 'my.path'))
	})

	it('should return `NotNull` filter', () => {
		expect(ComparisonFilter.notNull('my.path')).toStrictEqual(
			new NullComparisonFilter(ComparisonOperator.NOT_NULL, 'my.path')
		)
	})
})

describe('ValueComparisonFilter', () => {
	it('should return `Equal` filter', () => {
		expect(ComparisonFilter.equal('my.path', 'abc')).toStrictEqual(
			new ValueComparisonFilter(ComparisonOperator.EQUAL, 'my.path', 'abc')
		)
	})

	it('should return `NotEqual` filter', () => {
		expect(ComparisonFilter.notEqual('my.path', 'abc')).toStrictEqual(
			new ValueComparisonFilter(ComparisonOperator.NOT_EQUAL, 'my.path', 'abc')
		)
	})

	it('should return `GreaterThan` filter', () => {
		expect(ComparisonFilter.greaterThan('my.path', 'abc')).toStrictEqual(
			new ValueComparisonFilter(ComparisonOperator.GREATER_THAN, 'my.path', 'abc')
		)
	})

	it('should return `GreaterThanOrEqual` filter', () => {
		expect(ComparisonFilter.greaterThanOrEqual('my.path', 'abc')).toStrictEqual(
			new ValueComparisonFilter(ComparisonOperator.GREATER_THAN_OR_EQUAL, 'my.path', 'abc')
		)
	})

	it('should return `LessThan` filter', () => {
		expect(ComparisonFilter.lessThan('my.path', 'abc')).toStrictEqual(
			new ValueComparisonFilter(ComparisonOperator.LESS_THAN, 'my.path', 'abc')
		)
	})

	it('should return `LessThanOrEqual` filter', () => {
		expect(ComparisonFilter.lessThanOrEqual('my.path', 'abc')).toStrictEqual(
			new ValueComparisonFilter(ComparisonOperator.LESS_THAN_OR_EQUAL, 'my.path', 'abc')
		)
	})

	it('should return `Like` filter', () => {
		expect(ComparisonFilter.like('my.path', 'abc')).toStrictEqual(
			new ValueComparisonFilter(ComparisonOperator.LIKE, 'my.path', 'abc')
		)
	})

	it('should return `NotLike` filter', () => {
		expect(ComparisonFilter.notLike('my.path', 'abc')).toStrictEqual(
			new ValueComparisonFilter(ComparisonOperator.NOT_LIKE, 'my.path', 'abc')
		)
	})

	it('should return `Match` filter', () => {
		expect(ComparisonFilter.match('my.path', 'abc')).toStrictEqual(
			new ValueComparisonFilter(ComparisonOperator.MATCH, 'my.path', 'abc')
		)
	})

	it('should return `InsensitiveMatch` filter', () => {
		expect(ComparisonFilter.insensitiveMatch('my.path', 'abc')).toStrictEqual(
			new ValueComparisonFilter(ComparisonOperator.INSENSITIVE_MATCH, 'my.path', 'abc')
		)
	})
})

describe('LogicalComparisonFilter', () => {
	const filters = [ComparisonFilter.equal('a', 'b'), ComparisonFilter.notEqual('c', 'd')]

	it('should return `and` filter', () => {
		expect(LogicalFilter.and(filters)).toStrictEqual(new LogicalFilter(LogicalOperator.AND, filters))
	})

	it('should return `or` filter', () => {
		expect(LogicalFilter.or(filters)).toStrictEqual(new LogicalFilter(LogicalOperator.OR, filters))
	})
})
