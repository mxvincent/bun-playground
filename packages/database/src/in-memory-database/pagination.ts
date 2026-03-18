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

		/**
		 * Equality: `col = val` or `col IS NULL` when cursor value is null
		 */
		const whereEqual = (path: KeyOf<T>): Filter<KeyOf<T>> => {
			const value = cursorValues[path]
			return value == null ? ComparisonFilter.null(path) : ComparisonFilter.equal(path, value)
		}

		/**
		 * "After cursor" filter, respecting NULL ordering:
		 * - ASC  NULLS LAST:  order is [values..., NULL]
		 * - DESC NULLS FIRST: order is [NULL, values...]
		 */
		const whereAfter = ({ direction, path }: Sort<KeyOf<T>>): Filter<KeyOf<T>> => {
			const value = cursorValues[path]
			const isAsc = direction === SortDirection.ASC

			if (value == null) {
				// ASC NULLS LAST: NULL is last, nothing comes after → always false
				// DESC NULLS FIRST: NULL is first, all non-null come after
				return isAsc
					? LogicalFilter.and([ComparisonFilter.null(path), ComparisonFilter.notNull(path)])
					: ComparisonFilter.notNull(path)
			}

			if (isAsc) {
				// ASC NULLS LAST: after a non-null value = greater OR NULL
				return LogicalFilter.or([ComparisonFilter.greaterThan(path, value), ComparisonFilter.null(path)])
			}
			// DESC NULLS FIRST: NULLs already passed
			return ComparisonFilter.lessThan(path, value)
		}

		const conditions: Filter<KeyOf<T>>[] = []
		for (let i = 0; i < this.sorts.length; i++) {
			const currentSort = invariant(this.sorts[i])
			if (i === 0) {
				conditions.push(whereAfter(currentSort))
			} else {
				const equalities: Filter<KeyOf<T>>[] = []
				for (let j = 0; j < i; j++) {
					equalities.push(whereEqual(invariant(this.sorts[j]).path))
				}
				equalities.push(whereAfter(currentSort))
				conditions.push(LogicalFilter.and(equalities))
			}
		}

		return conditions.length > 1 ? [LogicalFilter.or(conditions)] : conditions
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
