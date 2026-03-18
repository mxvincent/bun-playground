import { describe, expect, it } from 'bun:test'
import { ComparisonFilter, LogicalFilter, Pagination, Sort } from '@package/query-params'
import { integer, pgTable, text, uuid } from 'drizzle-orm/pg-core'
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

describe('transformFilter()', () => {
	describe('value comparison operators', () => {
		it.each<{ filter: ComparisonFilter<TestKey>; description: string }>([
			{ filter: ComparisonFilter.equal<TestKey>('name', 'value'), description: 'EQUAL' },
			{ filter: ComparisonFilter.notEqual<TestKey>('name', 'value'), description: 'NOT_EQUAL' },
			{ filter: ComparisonFilter.greaterThan<TestKey>('name', 'value'), description: 'GREATER_THAN' },
			{ filter: ComparisonFilter.greaterThanOrEqual<TestKey>('name', 'value'), description: 'GREATER_THAN_OR_EQUAL' },
			{ filter: ComparisonFilter.lessThan<TestKey>('name', 'value'), description: 'LESS_THAN' },
			{ filter: ComparisonFilter.lessThanOrEqual<TestKey>('name', 'value'), description: 'LESS_THAN_OR_EQUAL' },
			{ filter: ComparisonFilter.like<TestKey>('name', 'value'), description: 'LIKE' },
			{ filter: ComparisonFilter.notLike<TestKey>('name', 'value'), description: 'NOT_LIKE' }
		])('should transform $description filter', ({ filter }) => {
			const result = transformFilter(filter, columnMapping)
			expect(result).toBeDefined()
		})
	})

	describe('array comparison operators', () => {
		it.each<{ filter: ComparisonFilter<TestKey>; description: string }>([
			{ filter: ComparisonFilter.in<TestKey>('name', ['a', 'b']), description: 'IN' },
			{ filter: ComparisonFilter.notIn<TestKey>('name', ['a', 'b']), description: 'NOT_IN' }
		])('should transform $description filter', ({ filter }) => {
			const result = transformFilter(filter, columnMapping)
			expect(result).toBeDefined()
		})
	})

	describe('null comparison operators', () => {
		it.each<{ filter: ComparisonFilter<TestKey>; description: string }>([
			{ filter: ComparisonFilter.null<TestKey>('name'), description: 'NULL' },
			{ filter: ComparisonFilter.notNull<TestKey>('name'), description: 'NOT_NULL' }
		])('should transform $description filter', ({ filter }) => {
			const result = transformFilter(filter, columnMapping)
			expect(result).toBeDefined()
		})
	})

	describe('logical operators', () => {
		it('should transform AND filter', () => {
			const filter = LogicalFilter.and([ComparisonFilter.equal('name', 'a'), ComparisonFilter.equal('name', 'b')])
			const result = transformFilter(filter, columnMapping)
			expect(result).toBeDefined()
		})
		it('should transform OR filter', () => {
			const filter = LogicalFilter.or([ComparisonFilter.equal('name', 'a'), ComparisonFilter.equal('name', 'b')])
			const result = transformFilter(filter, columnMapping)
			expect(result).toBeDefined()
		})
		it('should transform nested logical filters', () => {
			const filter = LogicalFilter.and([
				LogicalFilter.or([ComparisonFilter.equal('name', 'a'), ComparisonFilter.equal('name', 'b')]),
				ComparisonFilter.greaterThan('age', '10')
			])
			const result = transformFilter(filter, columnMapping)
			expect(result).toBeDefined()
		})
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
				{ filters: 'eq(unknown,value)' },
				{
					defaultSort: Sort.asc('id'),
					defaultPaginationSize: 10,
					columnMapping
				}
			)
		).toThrow('Invalid filter')
	})
})
