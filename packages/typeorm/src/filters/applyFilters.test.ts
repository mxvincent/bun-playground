import { afterAll, expect, it, spyOn } from 'bun:test'
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

// The SQL of each operator is covered by comparison.test.ts: only the composition is tested here
it('should add a comparison string to a query', () => {
	const queryBuilder = database.manager.createQueryBuilder(Author, 'author').select('id')
	const queryStringBase = queryBuilder.getQuery()
	applyFilters(queryBuilder, [ComparisonFilter.equal('author.a', 'value')])
	expect(queryBuilder.getQuery()).toEqual(`${queryStringBase} WHERE author.a = :parameter`)
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

it('should apply a logical filter nested in an `or` filter', async () => {
	const queryBuilder = database.manager.createQueryBuilder(Author, 'author').select('id')
	const queryStringBase = queryBuilder.getQuery()
	applyFilters(queryBuilder, [
		LogicalFilter.or([
			ComparisonFilter.equal('author.a', 'value'),
			LogicalFilter.and([ComparisonFilter.equal('author.b', 'value'), ComparisonFilter.equal('author.c', 'value')])
		])
	])
	expect(queryBuilder.getQuery()).toEqual(
		`${queryStringBase} WHERE (author.a = :parameter OR (author.b = :parameter AND author.c = :parameter))`
	)
})
