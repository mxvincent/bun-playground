import { invariant } from '@package/core'
import { type Filter, type Page, type Pagination, Sort, SortDirection } from '@package/query-params'
import { logger } from '@package/telemetry'
import { and, asc, desc, eq, gt, lt, or, type SQL } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import { transformFilters } from './query-params'

type CursorValue = string | number | Date | null

type EncodedCursor = string

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

		const sorts = parameters.sorts ?? []
		for (const requiredSort of Object.keys(this.primaryKey)) {
			if (!sorts.find((sort) => sort.path === requiredSort)) {
				sorts.push(Sort.asc(requiredSort as TColumns))
			}
		}

		const { size, cursor, isCountRequested } = parameters.pagination

		// Apply cursor conditions
		const cursorValues = cursor ? this.decodeCursor(cursor) : null
		if (cursorValues) {
			const cursorCondition = this.buildCursorCondition(sorts, cursorValues)
			query = query.where(and(cursorCondition, ...filters))
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
			edges: nodes.map((node) => ({ node, cursor: this.encodeCursor(node) })),
			hasNextPage,
			totalCount
		}
	}

	// For multi-column sorting, we need to build a compound condition
	// Example for [col1 ASC, col2 DESC]:
	// WHERE (col1, col2) > (cursor_val1, cursor_val2) in tuple comparison
	// Since Drizzle doesn't support tuple comparison directly, we expand it:
	// WHERE col1 > val1 OR (col1 = val1 AND col2 < val2)
	private buildCursorCondition(sorts: Sort<TColumns>[], cursorValues: Record<string, CursorValue>): SQL {
		const conditions: SQL[] = []

		for (let i = 0; i < sorts.length; i++) {
			const currentSort = invariant(sorts[i])
			const column = this.columnMapping[currentSort.path]
			const cursorValue = cursorValues[currentSort.path]

			// Build condition for this level
			const equalityConditions: SQL[] = []

			// Add equality conditions for all previous columns
			for (let j = 0; j < i; j++) {
				const prevSort = invariant(sorts[j])
				const prevColumn = this.columnMapping[prevSort.path]
				const prevValue = cursorValues[prevSort.path]
				equalityConditions.push(eq(prevColumn, prevValue))
			}

			// Add comparison for current column
			const comparison = currentSort.direction === SortDirection.ASC ? gt(column, cursorValue) : lt(column, cursorValue)

			if (equalityConditions.length > 0) {
				// biome-ignore lint/style/noNonNullAssertion: in this statement the conditions are always non-null
				conditions.push(and(...equalityConditions, comparison)!)
			} else {
				conditions.push(comparison)
			}
		}

		// biome-ignore lint/style/noNonNullAssertion: safe in this case
		return or(...conditions)!
	}

	private buildOrderClauses(sorts: Sort<TColumns>[]): SQL[] {
		return sorts.map((sort) => {
			const column = this.columnMapping[sort.path]
			return sort.direction === SortDirection.ASC ? asc(column) : desc(column)
		})
	}

	private encodeCursor(row: Record<string, unknown>): EncodedCursor {
		const json: Record<string, CursorValue> = Object.keys(this.primaryKey).reduce((record, key) => {
			return Object.assign(record, { [key]: row[key] })
		}, {})

		logger.trace({ json }, 'Encoded cursor')

		return Buffer.from(JSON.stringify(json)).toString('base64')
	}

	private decodeCursor(cursor: EncodedCursor): Record<string, CursorValue> {
		try {
			const decoded = Buffer.from(cursor, 'base64').toString('utf-8')
			const json = JSON.parse(decoded) as Record<string, CursorValue>
			Object.keys(this.primaryKey).forEach((key) => {
				if (!(key in json)) {
					throw new Error(`Malformed cursor: missing column ${key}`)
				}
			})
			logger.trace({ json }, 'Decoded cursor')
			return json
		} catch (error) {
			logger.error({ error }, 'Failed to decode cursor')
			throw new Error('Invalid cursor format')
		}
	}
}
