import { beforeAll, describe, expect, it } from 'bun:test'
import { invariant } from '@package/core'
import { sortArrayWith } from '@package/database'
import { Pagination, Sort } from '@package/query-params'
import { useDatabaseContext, useDatabaseTransaction } from '#test-helpers/database'
import { type AuthorRecord, factories } from '#test-helpers/factories'
import { authors } from '#test-helpers/schema'
import { DrizzleCursorPager } from './pagination'

// Drizzle's PgSelectBase removes `.where()` from the return type after it's called,
// making it incompatible with the recursive `DrizzleQuery` type. The runtime behavior
// is correct, so we use this helper to bypass the structural type mismatch.
// biome-ignore lint/suspicious/noExplicitAny: type workaround for Drizzle query builder
const asQuery = (query: any) => query

const database = useDatabaseContext()

const collectionSize = 25

const createAuthorPager = () => {
	return new DrizzleCursorPager({
		database: database.database,
		table: authors,
		primaryKey: { id: authors.id },
		columnMapping: {
			id: authors.id,
			name: authors.name,
			createdAt: authors.createdAt,
			gender: authors.gender,
			age: authors.age
		}
	})
}

const encodeCursor = (row: Record<string, unknown>): string => {
	const json = { id: row.id }
	return Buffer.from(JSON.stringify(json)).toString('base64')
}

describe('DrizzleCursorPager.getPage()', () => {
	describe.each<{ rawDataset: AuthorRecord[]; description: string }>([
		{
			rawDataset: factories.createAuthors({
				collectionSize,
				dateStep: 1,
				useSequentialIds: true
			}),
			description: `sequential id's, unique createdAt`
		},
		{
			rawDataset: factories.createAuthors({
				collectionSize,
				dateStep: 2,
				useSequentialIds: true
			}),
			description: `sequential id's, duplicated createdAt`
		},
		{
			rawDataset: factories.createAuthors({
				collectionSize,
				dateStep: 3,
				useSequentialIds: false
			}),
			description: `random ids, duplicated createdAt`
		}
	])('[DATASET] $description', ({ rawDataset }) => {
		useDatabaseTransaction(database, 'group')

		beforeAll(async () => {
			await database.database.insert(authors).values(rawDataset)
		})

		describe.each<{ sorts: Sort<keyof AuthorRecord>[]; description: string }>([
			{
				description: 'asc(id)',
				sorts: [Sort.asc('id')]
			},
			{
				description: 'desc(id)',
				sorts: [Sort.desc('id')]
			}
		])('[SORT] $description', ({ sorts }) => {
			const dataset = sortArrayWith(rawDataset, sorts)

			it('take first page', async () => {
				const pager = createAuthorPager()
				const query = asQuery(database.database.select().from(authors))

				const result = await pager.getPage({
					query,
					parameters: {
						sorts,
						pagination: Pagination.take(10)
					}
				})

				expect(result.edges).toHaveLength(10)
				expect(result.hasNextPage).toBe(true)
				expect(result.totalCount).toBe(collectionSize)
				expect(result.edges.map((e) => e.node.id)).toEqual(dataset.slice(0, 10).map((a) => a.id))
			})

			it('take second page', async () => {
				const pager = createAuthorPager()
				const query = asQuery(database.database.select().from(authors))
				const cursor = encodeCursor(invariant(dataset[9]))

				const result = await pager.getPage({
					query,
					parameters: {
						sorts,
						pagination: Pagination.take(10, cursor)
					}
				})

				expect(result.edges).toHaveLength(10)
				expect(result.hasNextPage).toBe(true)
				expect(result.totalCount).toBe(collectionSize)
				expect(result.edges.map((e) => e.node.id)).toEqual(dataset.slice(10, 20).map((a) => a.id))
			})

			it('take last page', async () => {
				const pager = createAuthorPager()
				const query = asQuery(database.database.select().from(authors))
				const cursor = encodeCursor(invariant(dataset[19]))

				const result = await pager.getPage({
					query,
					parameters: {
						sorts,
						pagination: Pagination.take(10, cursor)
					}
				})

				expect(result.edges).toHaveLength(5)
				expect(result.hasNextPage).toBe(false)
				expect(result.totalCount).toBe(collectionSize)
				expect(result.edges.map((e) => e.node.id)).toEqual(dataset.slice(20, 25).map((a) => a.id))
			})
		})
	})
})

describe('Performance: allow query without `totalCount` for better performance on large tables', () => {
	useDatabaseTransaction(database, 'group')

	const dataset = factories.createAuthors({
		collectionSize,
		dateStep: 1,
		useSequentialIds: false
	})

	beforeAll(async () => {
		await database.database.insert(authors).values(dataset)
	})

	it('should include `totalCount` as default behaviour', async () => {
		const pager = createAuthorPager()
		const query = asQuery(database.database.select().from(authors))

		const result = await pager.getPage({
			query,
			parameters: {
				pagination: Pagination.take(5)
			}
		})

		expect(result.totalCount).toBe(collectionSize)
	})

	it('should not include `totalCount` when disabled', async () => {
		const pager = createAuthorPager()
		const query = asQuery(database.database.select().from(authors))
		const pagination = Pagination.take(5)
		pagination.isCountRequested = false

		const result = await pager.getPage({
			query,
			parameters: { pagination }
		})

		expect(result.totalCount).toBeNull()
	})
})
