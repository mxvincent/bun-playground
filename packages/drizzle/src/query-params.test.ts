import { describe, expect, it } from 'bun:test'
import { ComparisonFilter, type Filter, LogicalFilter, Pagination, Sort } from '@package/query-params'
import { integer, PgDialect, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import type { ColumnMapping } from './query-params'
import {
	isMappedColumn,
	parseAndValidateQueryParameters,
	transformFilter,
	transformFilters,
	validateSort,
	validateSorts
} from './query-params'

type TestKey = 'id' | 'name' | 'age'

const testTable = pgTable('test', {
	id: uuid('id').primaryKey(),
	name: text('name').notNull(),
	age: integer('age')
})

const columnMapping: ColumnMapping<TestKey> = {
	id: testTable.id,
	name: testTable.name,
	age: testTable.age
}

describe('isMappedColumn()', () => {
	it('should return true for a mapped column', () => {
		expect(isMappedColumn(Sort.asc('id'), columnMapping)).toBe(true)
	})
	it('should return false for an unmapped column', () => {
		expect(isMappedColumn(Sort.asc('unknown'), columnMapping)).toBe(false)
	})
})

describe('validateSort()', () => {
	it('should return the sort when path is mapped', () => {
		const sort = Sort.asc('id')
		expect(validateSort(sort, columnMapping)).toBe(sort)
	})
	it('should throw when path is not mapped', () => {
		expect(() => validateSort(Sort.asc('unknown'), columnMapping)).toThrow('Invalid sort')
	})
})

describe('validateSorts()', () => {
	it('should return sorts when all paths are mapped', () => {
		const sorts = [Sort.asc('id'), Sort.desc('name')]
		expect(validateSorts(sorts, columnMapping)).toEqual(sorts)
	})
	it('should throw when any path is not mapped', () => {
		const sorts = [Sort.asc('id'), Sort.asc('unknown')]
		expect(() => validateSorts(sorts, columnMapping)).toThrow('Invalid sort')
	})
	it('should collect all invalid sorts before throwing', () => {
		const sorts = [Sort.asc('unknown'), Sort.desc('invalid')]
		expect(() => validateSorts(sorts, columnMapping)).toThrow()
	})
})

const toSql = (filter: Filter<TestKey>) => new PgDialect().sqlToQuery(transformFilter(filter, columnMapping))

describe('transformFilter()', () => {
	it.each<[ComparisonFilter<TestKey>, string]>([
		[ComparisonFilter.equal('name', 'v'), '"test"."name" = $1'],
		[ComparisonFilter.notEqual('name', 'v'), '"test"."name" <> $1'],
		[ComparisonFilter.greaterThan('name', 'v'), '"test"."name" > $1'],
		[ComparisonFilter.greaterThanOrEqual('name', 'v'), '"test"."name" >= $1'],
		[ComparisonFilter.lessThan('name', 'v'), '"test"."name" < $1'],
		[ComparisonFilter.lessThanOrEqual('name', 'v'), '"test"."name" <= $1'],
		[ComparisonFilter.like('name', 'v'), '"test"."name" like $1'],
		[ComparisonFilter.notLike('name', 'v'), '"test"."name" not like $1'],
		[ComparisonFilter.match('name', 'v'), 'cast("test"."name" as text) ~ $1'],
		[ComparisonFilter.insensitiveMatch('name', 'v'), 'cast("test"."name" as text) ~* $1']
	])('translates %p into %p', (filter, sql) => {
		expect(toSql(filter)).toMatchObject({ sql, params: ['v'] })
	})

	it.each<[ComparisonFilter<TestKey>, string]>([
		[ComparisonFilter.in('name', ['a', 'b']), '"test"."name" in ($1, $2)'],
		[ComparisonFilter.notIn('name', ['a', 'b']), '"test"."name" not in ($1, $2)']
	])('translates %p into %p', (filter, sql) => {
		expect(toSql(filter)).toMatchObject({ sql, params: ['a', 'b'] })
	})

	it.each<[ComparisonFilter<TestKey>, string]>([
		[ComparisonFilter.null('name'), '"test"."name" is null'],
		[ComparisonFilter.notNull('name'), '"test"."name" is not null']
	])('translates %p into %p', (filter, sql) => {
		expect(toSql(filter)).toMatchObject({ sql, params: [] })
	})

	it.each<[Filter<TestKey>, string]>([
		[
			LogicalFilter.and([ComparisonFilter.equal('name', 'a'), ComparisonFilter.null('age')]),
			'("test"."name" = $1 and "test"."age" is null)'
		],
		[
			LogicalFilter.or([ComparisonFilter.equal('name', 'a'), ComparisonFilter.null('age')]),
			'("test"."name" = $1 or "test"."age" is null)'
		],
		[
			LogicalFilter.and([
				LogicalFilter.or([ComparisonFilter.equal('name', 'a'), ComparisonFilter.null('age')]),
				ComparisonFilter.notNull('id')
			]),
			'(("test"."name" = $1 or "test"."age" is null) and "test"."id" is not null)'
		]
	])('translates the logical filter %p into %p', (filter, sql) => {
		expect(toSql(filter).sql).toBe(sql)
	})
})

describe('transformFilters()', () => {
	it('should return empty array for undefined filters', () => {
		expect(transformFilters(undefined, columnMapping)).toEqual([])
	})
	it('should transform multiple filters', () => {
		const filters = [ComparisonFilter.equal('name', 'a'), ComparisonFilter.greaterThan('age', '10')]
		const result = transformFilters(filters, columnMapping)
		expect(result).toHaveLength(2)
	})
})

describe('parseAndValidateQueryParameters()', () => {
	it('should parse and validate with default options', () => {
		const result = parseAndValidateQueryParameters(
			{},
			{
				defaultSort: Sort.asc('id'),
				defaultPaginationSize: 10,
				columnMapping
			}
		)
		expect(result.pagination).toBeInstanceOf(Pagination)
		expect(result.filters).toEqual([])
		expect(result.sorts).toEqual([Sort.asc('id')])
	})

	it('should use custom pagination size', () => {
		const result = parseAndValidateQueryParameters(
			{ size: 25 },
			{
				defaultSort: Sort.asc('id'),
				defaultPaginationSize: 10,
				columnMapping
			}
		)
		expect(result.pagination.size).toBe(25)
	})

	it('should parse cursor from after parameter', () => {
		const result = parseAndValidateQueryParameters(
			{ after: 'cursor-value' },
			{
				defaultSort: Sort.asc('id'),
				defaultPaginationSize: 10,
				columnMapping
			}
		)
		expect(result.pagination.cursor).toBe('cursor-value')
	})

	it('should throw for invalid sort paths', () => {
		expect(() =>
			parseAndValidateQueryParameters(
				{ sorts: 'asc(unknown)' },
				{
					defaultSort: Sort.asc('id'),
					defaultPaginationSize: 10,
					columnMapping
				}
			)
		).toThrow('Invalid sort')
	})

	it('should throw for invalid filter paths', () => {
		expect(() =>
			parseAndValidateQueryParameters(
				{ filters: 'equal(unknown,dmFsdWU)' },
				{
					defaultSort: Sort.asc('id'),
					defaultPaginationSize: 10,
					columnMapping
				}
			)
		).toThrow('Invalid filter')
	})
})
