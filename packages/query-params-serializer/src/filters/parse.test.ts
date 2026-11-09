import { describe, expect, it } from 'bun:test'
import { ComparisonFilter, LogicalFilter } from '@package/query-params'
import { QueryStringParameterValidationError } from '../shared/errors'
import { parseFilters, parseLogicalFilterParameters } from './parse'
import { encodeFilterValue as v } from './value-encoding'

it('parseLogicalFilterParameters() splits the top level filters', () => {
	expect(parseLogicalFilterParameters('equal(a,a),or(equal(b,b),equal(c,c))')).toStrictEqual([
		'equal(a,a)',
		'or(equal(b,b),equal(c,c))'
	])
})

describe('parseFilters()', () => {
	it.each([
		[`equal(status,${v('active')})`, ComparisonFilter.equal('status', 'active')],
		[`in(id,${v('1')},${v('2')})`, ComparisonFilter.in('id', ['1', '2'])],
		['null(date)', ComparisonFilter.null('date')],
		['equal(id,)', ComparisonFilter.equal('id', '')],
		[`equal(a,${v('va,l')})`, ComparisonFilter.equal('a', 'va,l')]
	])('parses %p', (queryStringParameter, filter) => {
		expect(parseFilters(queryStringParameter)).toStrictEqual([filter])
	})

	it('parses nested logical filters', () => {
		expect(parseFilters(`and(equal(a,${v('a')}),or(equal(b,${v('b')}),in(c,${v('c')},${v('c')})))`)).toStrictEqual([
			LogicalFilter.and([
				ComparisonFilter.equal('a', 'a'),
				LogicalFilter.or([ComparisonFilter.equal('b', 'b'), ComparisonFilter.in('c', ['c', 'c'])])
			])
		])
	})

	it('parses every filter of a repeated query string parameter', () => {
		expect(parseFilters([`equal(a,${v('a')})`, 'null(b)'])).toStrictEqual([
			ComparisonFilter.equal('a', 'a'),
			ComparisonFilter.null('b')
		])
	})

	it.each([
		['a malformed filter', 'equal'],
		['an unknown operator', 'unknown(a,b)'],
		['a logical filter without filters', 'or()'],
		['a filter without path', `equal(,${v('a')})`],
		['a value filter without value', 'equal(a)'],
		['a logical filter with unbalanced parentheses', `or(equal(a,${v('a')})`],
		['a logical filter cut by a raw parenthesis in a value', 'or(equal(a,x)y),null(b))']
	])('rejects %s', (_case, queryStringParameter) => {
		expect(() => parseFilters(queryStringParameter)).toThrow(QueryStringParameterValidationError)
	})
})
