import { describe, expect, it } from 'bun:test'
import { ComparisonFilter, LogicalFilter } from './filters'
import { flattenComparisonPaths, removeDuplicatedFilters } from './helpers'

describe('flattenComparisonPaths()', () => {
	it('should return comparison paths', () => {
		expect(
			flattenComparisonPaths([LogicalFilter.or([ComparisonFilter.equal('a', 'a'), ComparisonFilter.equal('b', 'b')])])
		).toStrictEqual(['a', 'b'])
	})

	it('should remove duplicated values', () => {
		expect(
			flattenComparisonPaths([LogicalFilter.or([ComparisonFilter.equal('a', 'a'), ComparisonFilter.equal('a', 'a')])])
		).toStrictEqual(['a'])
	})
})

describe('removeDuplicatedFilters', () => {
	it('should remove duplicated filters', () => {
		const filter = ComparisonFilter.equal('a', 'a')
		expect(removeDuplicatedFilters([filter, filter])).toStrictEqual([filter])
	})

	it('should handle nested filters', () => {
		const filter = ComparisonFilter.equal('a', 'a')
		expect(removeDuplicatedFilters([filter, LogicalFilter.or([filter, filter])])).toStrictEqual([
			filter,
			LogicalFilter.or([filter])
		])
	})
})
