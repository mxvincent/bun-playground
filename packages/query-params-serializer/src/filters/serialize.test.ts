import { beforeEach, describe, expect, it, jest } from 'bun:test'
import { ComparisonFilter, LogicalFilter } from '@package/query-params'
import { serializeFilter } from './serialize'

const encode = jest.fn(encodeURIComponent)

beforeEach(async () => {
	encode.mockClear()
})

describe('should encode filter values', () => {
	it.each([
		{
			filter: ComparisonFilter.null('a'),
			output: 'null(a)',
			shouldCallEncodeTimes: 0
		},
		{
			filter: ComparisonFilter.equal('a', 'va,l'),
			output: 'equal(a,va%2Cl)',
			shouldCallEncodeTimes: 1
		},
		{
			filter: ComparisonFilter.in('a', ['val', 'va,l']),
			output: 'in(a,val,va%2Cl)',
			shouldCallEncodeTimes: 2
		},
		{
			filter: LogicalFilter.and([ComparisonFilter.equal('a', 'va,l'), ComparisonFilter.in('a', ['val', 'va,l'])]),
			output: 'and(equal(a,va%2Cl),in(a,val,va%2Cl))',
			shouldCallEncodeTimes: 3
		}
	])('$output', async ({ filter, output, shouldCallEncodeTimes }) => {
		expect(serializeFilter(filter, encode)).toStrictEqual(output)
		expect(encode).toHaveBeenCalledTimes(shouldCallEncodeTimes)
	})
})

describe('should serialize logical filters', () => {
	it.each([
		{
			filter: LogicalFilter.and([ComparisonFilter.equal('a', 'a')]),
			output: 'and(equal(a,a))'
		},
		{
			filter: LogicalFilter.and([ComparisonFilter.equal('a', 'a'), ComparisonFilter.equal('b', 'b')]),
			output: 'and(equal(a,a),equal(b,b))'
		},
		{
			filter: LogicalFilter.or([
				LogicalFilter.and([ComparisonFilter.equal('a', 'a'), ComparisonFilter.equal('b', 'b')]),
				LogicalFilter.and([ComparisonFilter.equal('a', 'a'), ComparisonFilter.equal('c', 'c')])
			]),
			output: 'or(and(equal(a,a),equal(b,b)),and(equal(a,a),equal(c,c)))'
		}
	])('$output', async ({ filter, output }) => {
		expect(serializeFilter(filter, encode)).toStrictEqual(output)
	})
})
