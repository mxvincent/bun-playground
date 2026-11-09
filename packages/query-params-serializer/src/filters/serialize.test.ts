import { expect, it } from 'bun:test'
import { ComparisonFilter, LogicalFilter } from '@package/query-params'
import { serializeFilters } from './serialize'

it.each([
	[ComparisonFilter.null('a'), 'null(a)'],
	[ComparisonFilter.equal('a', 'va,l'), 'equal(a,va%2Cl)'],
	[ComparisonFilter.in('a', ['val', 'va,l']), 'in(a,val,va%2Cl)'],
	[
		LogicalFilter.or([LogicalFilter.and([ComparisonFilter.equal('a', 'a')]), ComparisonFilter.null('b')]),
		'or(and(equal(a,a)),null(b))'
	]
])('serializes %p as %p', (filter, output) => {
	expect(serializeFilters([filter])).toStrictEqual([output])
})
