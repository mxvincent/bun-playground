import { describe, expect, it, spyOn } from 'bun:test'
import { ComparisonFilter } from '@package/query-params'
import { generateComparisonString } from './comparison'
import { QueryUtils } from './generateParameterName'

spyOn(QueryUtils, 'generateParameterName').mockImplementation(() => 'parameter')

describe('get comparison string', () => {
	it.each<{
		filter: ComparisonFilter
		output: string
	}>([
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
		expect(generateComparisonString(filter, 'parameter')).toBe(output)
	})
})
