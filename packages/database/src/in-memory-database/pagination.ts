import * as assert from 'node:assert'
import { invariant, type KeyOf, type ObjectLiteral } from '@package/core'
import {
	ComparisonFilter,
	type Filter,
	LogicalFilter,
	type Page,
	type Pagination,
	PaginationCursorTransformer,
	type Sort,
	SortDirection
} from '@package/query-params'
import { windowed } from 'es-toolkit'
import type { Resource } from '../interfaces/resource'
import { filterArrayWith } from './filter'
import { sortArrayWith } from './sort'

/**
 * Array-based pager that implements cursor-based pagination
 * Similar to the Pager class from the typeorm package
 */
export class ArrayPager<T extends ObjectLiteral> {
	readonly cursorTransformer: PaginationCursorTransformer<T>
	private readonly resources: T[]
	private readonly filters: Filter<KeyOf<T>>[]
	private readonly sorts: Sort<KeyOf<T>>[]

	constructor(
		items: T[],
		options: {
			filters: Filter<KeyOf<T>>[]
			sorts: Sort<KeyOf<T>>[]
			cursorTransformer?: PaginationCursorTransformer<T>
		}
	) {
		this.resources = items
		this.filters = options.filters.slice()
		this.sorts = options.sorts.slice()
		if (!this.sorts.find(({ path }) => path === 'id')) {
			this.sorts.push({ path: 'id' as KeyOf<T>, direction: SortDirection.ASC })
		}
		this.cursorTransformer =
			options.cursorTransformer ?? new PaginationCursorTransformer(this.sorts.map(({ path }) => path))
	}

	/**
	 * Get a page of resources based on pagination options
	 */
	async getPage(pagination: Pagination): Promise<Page<T>> {
		// Apply sorts
		const sortedItems = sortArrayWith(this.resources, this.sorts)

		// Apply filters
		let filteredItems = filterArrayWith(sortedItems, this.filters)
		const totalCount = pagination.isCountRequested ? filteredItems.length : null

		if (pagination.cursor) {
			const cursorFilters = this.getCursorFilters(pagination.cursor)
			filteredItems = filterArrayWith(filteredItems, cursorFilters)
		}

		// If no resources, return an empty page
		if (filteredItems.length === 0) {
			return {
				edges: [],
				hasNextPage: false,
				totalCount: filteredItems.length
			} satisfies Page<T>
		}

		// Apply pagination
		const paginatedItems = filteredItems.slice(0, pagination.size)
		const edges = paginatedItems.map((node) => ({
			node,
			cursor: this.cursorTransformer.encode(node)
		}))
		return {
			edges,
			hasNextPage: filteredItems.length > paginatedItems.length,
			totalCount
		}
	}

	private getCursorFilters(cursor: string): Filter<KeyOf<T>>[] {
		const cursorValues = this.cursorTransformer.decode(cursor)
		const sortToFilter = ({ direction, path }: Sort<KeyOf<T>>) => {
			if (direction === SortDirection.ASC) {
				return ComparisonFilter.greaterThan(path, cursorValues[path])
			} else {
				return ComparisonFilter.lessThan(path, cursorValues[path])
			}
		}
		const firstSort = invariant(this.sorts[0], 'No sort defined')
		const filters: Filter<KeyOf<T>>[] = [sortToFilter(firstSort)]
		for (const [a, b] of windowed(this.sorts, 2)) {
			assert.ok(a)
			assert.ok(b)
			filters.push(LogicalFilter.and([ComparisonFilter.equal(a.path, cursorValues[a.path]), sortToFilter(b)]))
		}
		if (filters.length > 1) {
			return [LogicalFilter.or(filters)]
		}
		return filters
	}
}

/**
 * Helper function to create a pager and get a page in one call
 */
export async function paginateArray<T extends Resource>(
	items: T[],
	options: {
		filters: Filter<KeyOf<T>>[]
		sorts: Sort<KeyOf<T>>[]
		pagination: Pagination
	}
): Promise<Page<T>> {
	const pager = new ArrayPager(items, {
		filters: options.filters,
		sorts: options.sorts
	})
	return await pager.getPage(options.pagination)
}
