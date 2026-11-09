import { describe, expect, it } from 'bun:test'
import { ComparisonFilter, LogicalFilter } from './filters'
import { flattenComparisonPaths, removeDuplicatedFilters } from './helpers'

describe('flattenComparisonPaths()', () => {
	it('returns the paths of nested comparison filters', () => {
		expect(
			flattenComparisonPaths([LogicalFilter.or([ComparisonFilter.equal('a', 'a'), ComparisonFilter.equal('b', 'b')])])
		).toStrictEqual(['a', 'b'])
	})

	it('returns each path once', () => {
		expect(
			flattenComparisonPaths([LogicalFilter.or([ComparisonFilter.equal('a', 'a'), ComparisonFilter.equal('a', 'a')])])
		).toStrictEqual(['a'])
	})
})

describe('removeDuplicatedFilters()', () => {
	it('removes identical filters', () => {
		expect(removeDuplicatedFilters([ComparisonFilter.equal('a', '1'), ComparisonFilter.equal('a', '1')])).toStrictEqual(
			[ComparisonFilter.equal('a', '1')]
		)
	})

	it('keeps distinct filters on the same path', () => {
		const filters = [ComparisonFilter.equal('a', '1'), ComparisonFilter.notEqual('a', '2')]
		expect(removeDuplicatedFilters(filters)).toStrictEqual(filters)
	})

	it('removes identical filters nested in logical filters', () => {
		const filter = ComparisonFilter.equal('a', '1')
		expect(removeDuplicatedFilters([filter, LogicalFilter.or([filter, filter])])).toStrictEqual([
			filter,
			LogicalFilter.or([filter])
		])
	})

	it('does not mutate the given logical filters', () => {
		const filter = ComparisonFilter.equal('a', '1')
		const or = LogicalFilter.or([filter, filter])
		removeDuplicatedFilters([or])
		expect(or.filters).toStrictEqual([filter, filter])
	})
})
