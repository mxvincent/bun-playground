import { type KeyOf, type ObjectLiteral, sha1 } from '@package/core'
import {
	type Page,
	type PageEdge,
	type Pagination,
	PaginationCursorTransformer,
	type Sort,
	SortDirection
} from '@package/query-params'
import invariant from 'tiny-invariant'
import { Brackets, type ObjectType, type SelectQueryBuilder } from 'typeorm'
import { getAliasedPath } from './helpers/sortPath'
import { type CollectionSorterOptions, Sorter } from './sort'

export type PagerOptions<T extends ObjectLiteral> = {
	cursorTransformer?: PaginationCursorTransformer<T>
} & CollectionSorterOptions<T>

export class Pager<T extends ObjectLiteral> extends Sorter<T> {
	readonly cursorTransformer: PaginationCursorTransformer<T>

	constructor(
		protected override entity: ObjectType<T>,
		{ cursorTransformer, ...options }: PagerOptions<T>
	) {
		super(entity, options)
		this.cursorTransformer = cursorTransformer ?? new PaginationCursorTransformer(this.sorts.map(({ path }) => path))
	}

	/**
	 * Generate GraphEdge from a record
	 */
	generateEdge(node: T): PageEdge<T> {
		return {
			cursor: this.cursorTransformer.encode(node),
			node
		}
	}

	/**
	 * Build a `Page` from given `Pagination` options
	 */
	async getPage(pagination: Pagination): Promise<Page<T>> {
		// Clone initial query
		const query = this.cloneInitialQuery()

		// Apply sorts
		this.applySorts(query)

		// Optionally count items matching filters
		const totalCount = pagination.isCountRequested ? await query.getCount() : null

		// Get page nodes from the database
		const getNodes = async (pageSize: number, cursor?: string) => {
			const getPageQuery = query.clone()
			if (cursor) {
				this.applyCursorConstraint(getPageQuery, cursor)
			}
			getPageQuery.limit(pageSize)
			return getPageQuery.getMany()
		}

		const nodes = await getNodes(pagination.size, pagination.cursor)

		const edges = nodes.map((node) => this.generateEdge(node))
		const lastEdge = edges.at(pagination.size - 1)
		const hasNextPage = lastEdge ? await getNodes(1, lastEdge.cursor).then((items) => items.length > 0) : false

		// Return pagination result
		return { edges, hasNextPage, totalCount }
	}

	/**
	 * Apply cursor related constraint on query builder
	 *
	 * With multiple sort params we build a compound OR condition
	 * that accumulates equality on all previous columns.
	 *
	 * Example for sorts (a, b, c) in ascending order:
	 *
	 *   WHERE a > pva
	 *      OR (a = pva AND b > pvb)
	 *      OR (a = pva AND b = pvb AND c > pvc)
	 */
	private applyCursorConstraint(query: SelectQueryBuilder<T>, cursor: string) {
		invariant(this.sorts.length > 0, 'Sort options must contain at least one element.')

		const cursorValues = this.cursorTransformer.decode(cursor)
		const aliasedPath = (sort: Sort) => getAliasedPath(sort.path, query.alias)
		const paramName = (sort: Sort) => sha1(sort.path)
		const isNullValue = (sort: Sort) => cursorValues[sort.path as KeyOf<T>] == null

		/**
		 * Equality check: `col = :val` or `col IS NULL` when cursor value is null
		 */
		const whereEqual = (sort: Sort) => {
			if (isNullValue(sort)) {
				return `${aliasedPath(sort)} IS NULL`
			}
			return `${aliasedPath(sort)} = :${paramName(sort)}`
		}

		/**
		 * "After cursor" check, respecting NULL ordering:
		 * - ASC  NULLS LAST:  order is [values..., NULL]
		 * - DESC NULLS FIRST: order is [NULL, values...]
		 */
		const whereAfter = (sort: Sort) => {
			const column = aliasedPath(sort)
			const isAsc = sort.direction === SortDirection.ASC

			if (isNullValue(sort)) {
				// ASC NULLS LAST: NULL is last, nothing comes after → impossible
				// DESC NULLS FIRST: NULL is first, all non-null values come after
				return isAsc ? 'FALSE' : `${column} IS NOT NULL`
			}

			const operator = isAsc ? '>' : '<'
			// ASC NULLS LAST: after a non-null value means greater OR NULL
			if (isAsc) {
				return `(${column} ${operator} :${paramName(sort)} OR ${column} IS NULL)`
			}
			// DESC NULLS FIRST: NULLs are before non-null values, already passed
			return `${column} ${operator} :${paramName(sort)}`
		}

		query.andWhere(
			new Brackets((qb) => {
				for (let i = 0; i < this.sorts.length; i++) {
					const currentSort = this.sorts[i]!
					if (i === 0) {
						qb.where(whereAfter(currentSort))
					} else {
						qb.orWhere(
							new Brackets((nested) => {
								for (let j = 0; j < i; j++) {
									nested.andWhere(whereEqual(this.sorts[j]!))
								}
								nested.andWhere(whereAfter(currentSort))
							})
						)
					}
				}
			})
		)

		// Only set parameters for non-null cursor values
		const nonNullEntries = Object.entries(cursorValues).filter(([, v]) => v != null)
		query.setParameters(Object.fromEntries(nonNullEntries.map(([k, v]) => [sha1(k), v])))
	}
}
