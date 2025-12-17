import { afterAll, describe, expect, it, spyOn } from 'bun:test'
import { ComparisonFilter, LogicalFilter } from '@package/query-params'
import { useDatabaseContext } from '#test-helpers/database'
import { Author } from '#test-helpers/entities'
import { applyFilters } from './applyFilters'
import { QueryUtils } from './generateParameterName'

const database = useDatabaseContext()

const generateParameterNameSpy = spyOn(QueryUtils, 'generateParameterName').mockImplementation(() => 'parameter')

afterAll(() => {
	generateParameterNameSpy.mockRestore()
})

describe('apply comparison operator to a query', () => {
	it.each<{ filter: ComparisonFilter; output: string }>([
		{
			filter: ComparisonFilter.equal('key', 'value'),
			output: 'key = :parameter'
		},
		{
			filter: ComparisonFilter.notEqual('key', 'value'),
			output: 'key <> :parameter'
		},
		{
			filter: ComparisonFilter.lessThan('key', 'value'),
			output: 'key < :parameter'
		},
		{
			filter: ComparisonFilter.lessThanOrEqual('key', 'value'),
			output: 'key <= :parameter'
		},
		{
			filter: ComparisonFilter.greaterThan('key', 'value'),
			output: 'key > :parameter'
		},
		{
			filter: ComparisonFilter.greaterThanOrEqual('key', 'value'),
			output: 'key >= :parameter'
		},
		{
			filter: ComparisonFilter.like('key', 'value'),
			output: 'CAST(key as TEXT) LIKE :parameter'
		},
		{
			filter: ComparisonFilter.notLike('key', 'value'),
			output: 'CAST(key as TEXT) NOT LIKE :parameter'
		},
		{
			filter: ComparisonFilter.in('key', ['value']),
			output: 'key IN (:...parameter)'
		},
		{
			filter: ComparisonFilter.notIn('key', ['value']),
			output: 'key NOT IN (:...parameter)'
		},
		{
			filter: ComparisonFilter.match('key', 'value'),
			output: 'CAST(key as TEXT) ~ :parameter'
		},
		{
			filter: ComparisonFilter.insensitiveMatch('key', 'value'),
			output: 'CAST(key as TEXT) ~* :parameter'
		},
		{ filter: ComparisonFilter.null('key'), output: 'key IS NULL' },
		{ filter: ComparisonFilter.notNull('key'), output: 'key IS NOT NULL' }
	])('operator: $filter.operator', ({ filter, output }) => {
		const queryBuilder = database.manager.createQueryBuilder(Author, 'author').select('id')
		const queryStringBase = queryBuilder.getQuery()
		applyFilters(queryBuilder, [filter])

		expect(queryBuilder.getQuery()).toEqual(`${queryStringBase} WHERE ${output}`)
	})
})

it('should add many comparison string to a query', async () => {
	const queryBuilder = database.manager.createQueryBuilder(Author, 'author').select('id')
	const queryStringBase = queryBuilder.getQuery()
	applyFilters(queryBuilder, [ComparisonFilter.equal('author.a', 'value'), ComparisonFilter.equal('author.b', 'value')])
	expect(queryBuilder.getQuery()).toEqual(`${queryStringBase} WHERE author.a = :parameter AND author.b = :parameter`)
})

it('should apply `or` filter at root', async () => {
	const queryBuilder = database.manager.createQueryBuilder(Author, 'author').select('id')
	const queryStringBase = queryBuilder.getQuery()
	applyFilters(queryBuilder, [
		LogicalFilter.or([ComparisonFilter.equal('author.a', 'value'), ComparisonFilter.equal('author.b', 'value')])
	])
	expect(queryBuilder.getQuery()).toEqual(`${queryStringBase} WHERE (author.a = :parameter OR author.b = :parameter)`)
})

it('should apply nested logical', async () => {
	const queryBuilder = database.manager.createQueryBuilder(Author, 'author').select('id')
	const queryStringBase = queryBuilder.getQuery()
	applyFilters(queryBuilder, [
		LogicalFilter.or([ComparisonFilter.equal('author.a', 'value'), ComparisonFilter.equal('author.b', 'value')]),
		ComparisonFilter.equal('author.c', 'value')
	])
	expect(queryBuilder.getQuery()).toEqual(
		`${queryStringBase} WHERE (author.a = :parameter OR author.b = :parameter) AND author.c = :parameter`
	)
})
