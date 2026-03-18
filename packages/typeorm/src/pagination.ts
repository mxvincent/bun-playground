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

		const aliasedPath = (sort: Sort) => getAliasedPath(sort.path, query.alias)
		const paramName = (sort: Sort) => sha1(sort.path)

		query.andWhere(
			new Brackets((qb) => {
				for (let i = 0; i < this.sorts.length; i++) {
					const currentSort = this.sorts[i]!
					const operator = currentSort.direction === SortDirection.ASC ? '>' : '<'

					if (i === 0) {
						qb.where(`${aliasedPath(currentSort)} ${operator} :${paramName(currentSort)}`)
					} else {
						qb.orWhere(
							new Brackets((nested) => {
								for (let j = 0; j < i; j++) {
									const prevSort = this.sorts[j]!
									nested.andWhere(`${aliasedPath(prevSort)} = :${paramName(prevSort)}`)
								}
								nested.andWhere(`${aliasedPath(currentSort)} ${operator} :${paramName(currentSort)}`)
							})
						)
					}
				}
			})
		)

		query.setParameters(
			Object.fromEntries(Object.entries(this.cursorTransformer.decode(cursor)).map(([k, v]) => [sha1(k), v]))
		)
	}
}
