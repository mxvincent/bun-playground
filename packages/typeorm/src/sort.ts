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

export type SorterOptions<T extends ObjectLiteral> = {
	/**
	 * Base query, never modified: each call works on a clone
	 */
	query: SelectQueryBuilder<T>
}

export type GetSortedCollectionOptions<T extends ObjectLiteral> = {
	sorts?: Sort<KeyOf<T>>[]
	filters?: (ComparisonFilter<KeyOf<T>> | LogicalFilter<KeyOf<T>>)[]
}

/**
 * Apply sorts to a query builder, with the null ordering of PostgreSQL:
 * NULLS LAST in ascending order, NULLS FIRST in descending order
 */
export const applySorts = <T extends ObjectLiteral>(query: SelectQueryBuilder<T>, sorts: Sort<KeyOf<T>>[]): void => {
	for (const sort of sorts) {
		query.addOrderBy(
			getAliasedPath(sort.path, query.alias),
			sort.direction === SortDirection.DESC ? 'DESC' : 'ASC',
			sort.direction === SortDirection.DESC ? 'NULLS FIRST' : 'NULLS LAST'
		)
	}
}

/**
 * Sorted collection over a base query.
 *
 * A `Sorter` holds what is shared by every request (entity, base query) and receives what comes
 * from the request (sorts, filters) on each `getSortedCollection()` call, like `Pager`.
 */
export class Sorter<T extends ObjectLiteral> {
	private readonly baseQuery: SelectQueryBuilder<T>
	private readonly entity: ObjectType<T>
	private readonly primaryKeyColumns: NonEmptyArray<KeyOf<T>>

	constructor(entity: ObjectType<T>, options: SorterOptions<T>) {
		this.entity = entity
		this.primaryKeyColumns = getPrimaryKeyColumns(entity)
		this.baseQuery = options.query
	}

	/**
	 * Query the whole collection, filtered and sorted, with the primary key as tie-breaker
	 */
	async getSortedCollection({ sorts, filters }: GetSortedCollectionOptions<T> = {}): Promise<T[]> {
		// TypeORM's clone copies the expression map, so the base query is never modified
		const query = this.baseQuery.clone()
		if (filters) {
			applyFilters(query, enforceFilterPathAliasing(filters, query.alias), LogicalOperator.AND)
		}
		applySorts(query, mergePrimaryKeySorts(sorts ?? getDefaultSort(this.entity), this.primaryKeyColumns))
		return query.getMany()
	}
}
