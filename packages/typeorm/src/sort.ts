import type { KeyOf, NonEmptyArray, ObjectLiteral } from '@package/core'
import {
	type ComparisonFilter,
	type Filter,
	isLogicalFilter,
	type LogicalFilter,
	LogicalOperator,
	type Sort,
	SortDirection
} from '@package/query-params'
import { clone } from 'es-toolkit'
import type { ObjectType, SelectQueryBuilder } from 'typeorm'
import { applyFilters } from './filters/applyFilters'
import { getPrimaryKeyColumns } from './helpers/primary-key'
import { getAliasedPath, getDefaultSort, mergePrimaryKeySorts } from './helpers/sortPath'

export const enforceFilterPathAliasing = (filters: (ComparisonFilter | LogicalFilter)[], alias: string): Filter[] => {
	return filters.map((filter) => {
		if (isLogicalFilter(filter)) {
			return Object.assign(Object.create(filter), {
				filters: enforceFilterPathAliasing(filter.filters, alias)
			})
		}
		if (filter.path.includes('.')) {
			return filter
		}
		return Object.assign(Object.create(filter), {
			path: `${alias}.${filter.path}`
		})
	})
}

export type CollectionSorterOptions<T extends ObjectLiteral> = {
	filters?: (ComparisonFilter<KeyOf<T>> | LogicalFilter<KeyOf<T>>)[]
	sorts?: Sort<KeyOf<T>>[]
	query: SelectQueryBuilder<T>
}

const query = Symbol('CollectionSorter.query')

export class Sorter<T extends ObjectLiteral> {
	/**
	 * User provided query
	 */
	readonly [query]: SelectQueryBuilder<T>

	/**
	 * Resource primary key is used to get a predictable sort result
	 */
	readonly primaryKeyColumns: NonEmptyArray<KeyOf<T>>

	/**
	 * Collection sort options
	 */
	protected readonly sorts: NonEmptyArray<Sort<KeyOf<T>>>

	/**
	 * Create a collection sorter
	 */
	constructor(
		protected entity: ObjectType<T>,
		options: CollectionSorterOptions<T>
	) {
		this.primaryKeyColumns = getPrimaryKeyColumns(entity)
		this[query] = options.query
		if (options.filters) {
			const filters = enforceFilterPathAliasing(options.filters, options.query.alias)
			applyFilters(this[query], filters, LogicalOperator.AND)
		}
		this.sorts = mergePrimaryKeySorts(options.sorts ?? getDefaultSort(entity), this.primaryKeyColumns)
	}

	/**
	 * We need to clone the provided query
	 * The base query should only be filtered and parametrized
	 */
	cloneInitialQuery() {
		return clone(this[query])
	}

	/**
	 * Apply sortableKeys parameters then query the database without pagination
	 */
	async getSortedCollection(): Promise<T[]> {
		const query = this.cloneInitialQuery()
		this.applySorts(query)
		return query.getMany()
	}

	/**
	 * Apply sorts to the given query builder instance
	 * SQLite null values are considered bigger than non-null values like Postgres
	 * We can invert sort order with the second parameter to allow backward pagination
	 */
	protected applySorts(query: SelectQueryBuilder<T>) {
		for (const sort of this.sorts) {
			query.addOrderBy(
				getAliasedPath(sort.path, query.alias),
				sort.direction === SortDirection.DESC ? 'DESC' : 'ASC',
				sort.direction === SortDirection.DESC ? 'NULLS FIRST' : 'NULLS LAST'
			)
		}
	}
}
