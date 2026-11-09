import { expect, it } from 'bun:test'
import { ComparisonFilter, LogicalFilter } from '@package/query-params'
import { serializeFilters } from './serialize'
import { encodeFilterValue as v } from './value-encoding'

it.each([
	[ComparisonFilter.null('a'), 'null(a)'],
	[ComparisonFilter.equal('a', 'va,l'), `equal(a,${v('va,l')})`],
	[ComparisonFilter.in('a', ['val', 'va,l']), `in(a,${v('val')},${v('va,l')})`],
	[
		LogicalFilter.or([LogicalFilter.and([ComparisonFilter.equal('a', 'a')]), ComparisonFilter.null('b')]),
		`or(and(equal(a,${v('a')})),null(b))`
	]
])('serializes %p as %p', (filter, output) => {
	expect(serializeFilters([filter])).toStrictEqual([output])
})
