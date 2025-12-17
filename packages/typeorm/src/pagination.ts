import { type KeyOf, type ObjectLiteral, sha1 } from '@package/core'
import {
	type Page,
	type PageEdge,
	type Pagination,
	PaginationCursorTransformer,
	type Sort,
	SortDirection
} from '@package/query-params'
import { windowed } from 'es-toolkit'
import invariant from 'tiny-invariant'
import { Brackets, type ObjectType, type SelectQueryBuilder, type WhereExpressionBuilder } from 'typeorm'
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
	 * With multiple parameters we need to apply many where conditions
	 *
	 * example for 4 sort params (a,b,c,d) in ascending order
	 *
	 * cursor contains this value
	 * pva = a previous value from cursor
	 * pvb = b previous value from cursor
	 * pvc = c previous value from cursor
	 * pvd = d previous value from cursor
	 *
	 * select a, b, c, d
	 *   where a > pva
	 *   or a = pva and b > pvb
	 *   or b = pvb and c > pvc
	 *   or c = pvc and c > pvd
	 *   order by a, b, c, d
	 */
	private applyCursorConstraint(query: SelectQueryBuilder<T>, cursor: string) {
		const [firstSort] = this.sorts
		invariant(firstSort, 'Sort options must contain at least one element.')
		const whereEqual = (sort: Sort) => {
			return `${getAliasedPath(sort.path, query.alias)} = :${sha1(sort.path)}`
		}
		const whereGreaterOrLower = (sort: Sort) => {
			const operator = sort.direction === SortDirection.ASC ? '>' : '<'
			return `${getAliasedPath(sort.path, query.alias)} ${operator} :${sha1(sort.path)}`
		}
		const applyNextPairConstraint = (parentQueryBuilder: WhereExpressionBuilder, sorts: [Sort, Sort]) => {
			return parentQueryBuilder.orWhere(
				new Brackets((qb) => {
					qb.where(whereEqual(sorts[0])).andWhere(whereGreaterOrLower(sorts[1]))
				})
			)
		}
		query.andWhere(
			new Brackets((qb) => {
				qb.where(whereGreaterOrLower(firstSort))
				const sortPairs = windowed(this.sorts, 2) as [Sort<KeyOf<T>>, Sort<KeyOf<T>>][]
				if (sortPairs.length) {
					sortPairs.reduce(applyNextPairConstraint, qb)
				}
			})
		)
		query.setParameters(
			Object.fromEntries(Object.entries(this.cursorTransformer.decode(cursor)).map(([k, v]) => [sha1(k), v]))
		)
	}
}
