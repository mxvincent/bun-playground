import {
	type Filter,
	type Page,
	type Pagination,
	PaginationCursorTransformer,
	Sort,
	SortDirection
} from '@package/query-params'
import { logger } from '@package/telemetry'
import { and, or, type SQL, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import { transformFilters } from './query-params'

type CursorValues = Record<string, string | null>

// Type for a Drizzle query builder that supports the methods we need
type DrizzleQuery<TResult> = {
	where: (condition: SQL | undefined) => DrizzleQuery<TResult>
	orderBy: (...order: SQL[]) => DrizzleQuery<TResult>
	limit: (limit: number) => DrizzleQuery<TResult>
	then: (
		onfulfilled?: ((value: TResult[]) => TResult[] | PromiseLike<TResult[]>) | undefined | null,
		onrejected?: ((reason: unknown) => TResult[] | PromiseLike<TResult[]>) | undefined | null
	) => Promise<TResult[]>
}

type GetPageOptions<TColumns extends string, TResult> = {
	query: DrizzleQuery<TResult>
	parameters: {
		filters?: Filter<TColumns>[]
		sorts?: Sort<TColumns>[]
		pagination: Pagination
	}
}

export class DrizzleCursorPager<
	TDatabase extends NodePgDatabase<Record<string, unknown>>,
	TColumns extends string,
	TPrimaryKey extends TColumns
> {
	readonly database: TDatabase
	readonly table: PgTable
	readonly primaryKey: Record<TPrimaryKey, PgColumn>
	readonly columnMapping: Record<TColumns, PgColumn>

	constructor(options: {
		database: TDatabase
		table: PgTable
		primaryKey: Record<TPrimaryKey, PgColumn>
		columnMapping: Record<TColumns, PgColumn>
	}) {
		this.database = options.database
		this.table = options.table
		this.primaryKey = options.primaryKey
		this.columnMapping = options.columnMapping
	}

	async getPage<TResult extends Record<string, unknown>>({
		query,
		parameters
	}: GetPageOptions<TColumns, TResult>): Promise<Page<TResult>> {
		const filters = transformFilters(parameters.filters, this.columnMapping)

		// Break ties with the primary key, on a copy: the given sorts are not modified
		const givenSorts = parameters.sorts ?? []
		const sorts = [
			...givenSorts,
			...Object.keys(this.primaryKey)
				.filter((column) => !givenSorts.some((sort) => sort.path === column))
				.map((column) => Sort.asc(column as TColumns))
		]

		const { size, cursor, isCountRequested } = parameters.pagination

		// The cursor holds the value of every sort column of the last row of the previous page
		const cursorTransformer = new PaginationCursorTransformer<Record<string, unknown>>(sorts.map(({ path }) => path))

		// Apply the filters on every page, and the cursor condition after the first one
		const conditions = [...filters]
		const cursorValues = cursor ? this.decodeCursor(cursor, cursorTransformer) : null
		if (cursorValues) {
			conditions.push(this.buildCursorCondition(sorts, cursorValues))
		}
		if (conditions.length > 0) {
			query = query.where(and(...conditions))
		}

		// Apply ordering
		const orderClauses = this.buildOrderClauses(sorts)
		query = query.orderBy(...orderClauses)

		// Fetch limit + 1 to determine if there are more results
		query = query.limit(size + 1)

		const results = await query

		// Check if there are more results
		const hasNextPage = results.length > size
		const nodes = hasNextPage ? results.slice(0, size) : results

		// Fetch total count if requested
		const totalCount = isCountRequested
			? await this.database.$count(this.table, filters ? and(...filters) : undefined)
			: null

		return {
			edges: nodes.map((node) => ({ node, cursor: cursorTransformer.encode(node) })),
			hasNextPage,
			totalCount
		}
	}

	// For multi-column sorting, we need to build a compound condition
	// Example for [col1 ASC, col2 DESC]:
	// WHERE (col1, col2) > (cursor_val1, cursor_val2) in tuple comparison
	// Since Drizzle doesn't support tuple comparison directly, we expand it:
	// WHERE after(col1) OR (equal(col1) AND after(col2))
	// Cursor values are strings: they are sent as raw parameters, cast by PostgreSQL to the column type,
	// since the column mapping of Drizzle expects the decoded type (e.g. a Date for a timestamp)
	private buildCursorCondition(sorts: Sort<TColumns>[], cursorValues: CursorValues): SQL {
		/**
		 * Equality: `col = val`, or `col IS NULL` when the cursor value is null
		 */
		const whereEqual = ({ path }: Sort<TColumns>): SQL => {
			const value = cursorValues[path]
			const column = this.columnMapping[path]
			return value == null ? sql`${column} is null` : sql`${column} = ${value}`
		}

		/**
		 * "After cursor", respecting the NULL ordering:
		 * - ASC  NULLS LAST:  order is [values..., NULL]
		 * - DESC NULLS FIRST: order is [NULL, values...]
		 */
		const whereAfter = ({ path, direction }: Sort<TColumns>): SQL => {
			const value = cursorValues[path]
			const column = this.columnMapping[path]
			const isAsc = direction === SortDirection.ASC
			if (value == null) {
				// ASC: NULL is last, nothing comes after. DESC: NULL is first, every non-null value comes after
				return isAsc ? sql`false` : sql`${column} is not null`
			}
			// ASC: after a non-null value means greater, or NULL. DESC: NULLs were already passed
			return isAsc ? sql`(${column} > ${value} or ${column} is null)` : sql`${column} < ${value}`
		}

		const conditions = sorts.map((currentSort, index) => {
			const equalities = sorts.slice(0, index).map(whereEqual)
			// biome-ignore lint/style/noNonNullAssertion: and() of at least one condition is defined
			return equalities.length > 0 ? and(...equalities, whereAfter(currentSort))! : whereAfter(currentSort)
		})

		// biome-ignore lint/style/noNonNullAssertion: there is always at least one sort, the primary key
		return or(...conditions)!
	}

	/**
	 * ORDER BY with the NULL ordering of the cursor condition: NULLS LAST in asc, NULLS FIRST in desc
	 */
	private buildOrderClauses(sorts: Sort<TColumns>[]): SQL[] {
		return sorts.map((sort) => {
			const column = this.columnMapping[sort.path]
			return sort.direction === SortDirection.ASC ? sql`${column} asc nulls last` : sql`${column} desc nulls first`
		})
	}

	private decodeCursor(
		cursor: string,
		cursorTransformer: PaginationCursorTransformer<Record<string, unknown>>
	): CursorValues {
		try {
			const values = cursorTransformer.decode(cursor)
			logger.trace({ values }, 'Decoded cursor')
			return values
		} catch (error) {
			logger.error({ error }, 'Failed to decode cursor')
			throw new Error('Invalid cursor format')
		}
	}
}
