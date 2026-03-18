import { type KeyOf, type NonEmptyArray, type ObjectLiteral, sha1 } from '@package/core'
import {
	type ComparisonFilter,
	type Filter,
	type LogicalFilter,
	LogicalOperator,
	type Page,
	type PageEdge,
	type Pagination,
	PaginationCursorTransformer,
	type Sort,
	SortDirection
} from '@package/query-params'
import { clone } from 'es-toolkit'
import invariant from 'tiny-invariant'
import { Brackets, type ObjectType, type SelectQueryBuilder } from 'typeorm'
import { applyFilters } from './filters/applyFilters'
import { getPrimaryKeyColumns } from './helpers/primary-key'
import { getAliasedPath, getDefaultSort, mergePrimaryKeySorts } from './helpers/sortPath'
import { enforceFilterPathAliasing } from './sort'

export type PagerOptions<T extends ObjectLiteral> = {
	query: SelectQueryBuilder<T>
	filters?: (ComparisonFilter<KeyOf<T>> | LogicalFilter<KeyOf<T>>)[]
	cursorTransformer?: PaginationCursorTransformer<T>
}

export type GetPageOptions<T extends ObjectLiteral> = {
	pagination: Pagination
	sorts?: Sort<KeyOf<T>>[]
}

export class Pager<T extends ObjectLiteral> {
	private readonly baseQuery: SelectQueryBuilder<T>
	private readonly entity: ObjectType<T>
	private readonly primaryKeyColumns: NonEmptyArray<KeyOf<T>>
	private readonly cursorTransformer?: PaginationCursorTransformer<T>

	constructor(entity: ObjectType<T>, options: PagerOptions<T>) {
		this.entity = entity
		this.primaryKeyColumns = getPrimaryKeyColumns(entity)
		this.baseQuery = options.query
		this.cursorTransformer = options.cursorTransformer
		if (options.filters) {
			const filters = enforceFilterPathAliasing(options.filters, options.query.alias)
			applyFilters(this.baseQuery, filters as Filter[], LogicalOperator.AND)
		}
	}

	/**
	 * Build a `Page` from given options
	 */
	async getPage({ pagination, sorts: userSorts }: GetPageOptions<T>): Promise<Page<T>> {
		const sorts = mergePrimaryKeySorts(userSorts ?? getDefaultSort(this.entity), this.primaryKeyColumns)
		const transformer = this.cursorTransformer ?? new PaginationCursorTransformer<T>(sorts.map(({ path }) => path))

		// Clone base query and apply sorts
		const query = clone(this.baseQuery)
		this.applySorts(query, sorts)

		// Optionally count items matching filters
		const totalCount = pagination.isCountRequested ? await query.getCount() : null

		// Fetch size + 1 to determine if there are more results
		const pageQuery = query.clone()
		if (pagination.cursor) {
			this.applyCursorConstraint(pageQuery, pagination.cursor, sorts, transformer)
		}
		pageQuery.limit(pagination.size + 1)
		const results = await pageQuery.getMany()

		const hasNextPage = results.length > pagination.size
		const nodes = hasNextPage ? results.slice(0, pagination.size) : results
		const edges: PageEdge<T>[] = nodes.map((node) => ({
			cursor: transformer.encode(node),
			node
		}))

		return { edges, hasNextPage, totalCount }
	}

	private applySorts(query: SelectQueryBuilder<T>, sorts: NonEmptyArray<Sort<KeyOf<T>>>) {
		for (const sort of sorts) {
			query.addOrderBy(
				getAliasedPath(sort.path, query.alias),
				sort.direction === SortDirection.DESC ? 'DESC' : 'ASC',
				sort.direction === SortDirection.DESC ? 'NULLS FIRST' : 'NULLS LAST'
			)
		}
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
	private applyCursorConstraint(
		query: SelectQueryBuilder<T>,
		cursor: string,
		sorts: NonEmptyArray<Sort<KeyOf<T>>>,
		transformer: PaginationCursorTransformer<T>
	) {
		invariant(sorts.length > 0, 'Sort options must contain at least one element.')

		const cursorValues = transformer.decode(cursor)
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
			if (isAsc) {
				// ASC NULLS LAST: after a non-null value means greater OR NULL
				return `(${column} ${operator} :${paramName(sort)} OR ${column} IS NULL)`
			}
			// DESC NULLS FIRST: NULLs are before non-null values, already passed
			return `${column} ${operator} :${paramName(sort)}`
		}

		query.andWhere(
			new Brackets((qb) => {
				for (let i = 0; i < sorts.length; i++) {
					const currentSort = sorts[i]!
					if (i === 0) {
						qb.where(whereAfter(currentSort))
					} else {
						qb.orWhere(
							new Brackets((nested) => {
								for (let j = 0; j < i; j++) {
									nested.andWhere(whereEqual(sorts[j]!))
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