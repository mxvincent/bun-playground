import { beforeAll, describe, expect, it } from 'bun:test'
import { sortArrayWith } from '@package/database'
import { ComparisonFilter, Pagination, Sort } from '@package/query-params'
import { useDatabaseContext, useDatabaseTransaction } from '#test-helpers/database'
import { type AuthorRecord, type DateContainerRecord, factories } from '#test-helpers/factories'
import { authors, dateContainers } from '#test-helpers/schema'
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

const PAGE_SIZE = 10

/**
 * Walk through every page the way a client does: each page is requested with the cursor of the last edge
 */
const getAllPages = async (sorts: Sort<keyof AuthorRecord>[]) => {
	const pager = createAuthorPager()
	const pages = []
	let cursor: string | undefined
	do {
		const page = await pager.getPage({
			query: asQuery(database.database.select().from(authors)),
			parameters: { sorts, pagination: Pagination.take(PAGE_SIZE, cursor) }
		})
		pages.push(page)
		cursor = page.hasNextPage ? page.edges.at(-1)?.cursor : undefined
	} while (cursor)
	return pages
}

describe('DrizzleCursorPager.getPage()', () => {
	describe.each<{ rawDataset: AuthorRecord[]; description: string }>([
		{
			rawDataset: factories.createAuthors({ collectionSize, dateStep: 1, useSequentialIds: true }),
			description: `sequential id's, unique createdAt`
		},
		{
			rawDataset: factories.createAuthors({ collectionSize, dateStep: 2, useSequentialIds: true }),
			description: `sequential id's, duplicated createdAt`
		},
		{
			rawDataset: factories.createAuthors({ collectionSize, dateStep: 3, useSequentialIds: false }),
			description: `random ids, duplicated createdAt`
		}
	])('[DATASET] $description', ({ rawDataset }) => {
		useDatabaseTransaction(database, 'group')

		beforeAll(async () => {
			await database.database.insert(authors).values(rawDataset)
		})

		it.each<{ sorts: Sort<keyof AuthorRecord>[]; description: string }>([
			{ description: 'asc(id)', sorts: [Sort.asc('id')] },
			{ description: 'desc(id)', sorts: [Sort.desc('id')] },
			{ description: 'asc(createdAt)', sorts: [Sort.asc('createdAt')] },
			{ description: 'desc(createdAt)', sorts: [Sort.desc('createdAt')] },
			{ description: 'asc(createdAt) + desc(id)', sorts: [Sort.asc('createdAt'), Sort.desc('id')] },
			{ description: 'desc(gender) + asc(name)', sorts: [Sort.desc('gender'), Sort.asc('name')] }
		])('[SORT] $description: every page, in order', async ({ sorts }) => {
			// The pager breaks ties with asc(id) when the sorts do not include id
			const expected = sortArrayWith(
				rawDataset,
				sorts.some(({ path }) => path === 'id') ? sorts : [...sorts, Sort.asc('id')]
			)

			const pages = await getAllPages(sorts)

			expect(pages.map((page) => ({ ...page, edges: page.edges.map(({ node }) => node.id) }))).toStrictEqual(
				[0, 1, 2].map((index) => ({
					edges: expected.slice(index * PAGE_SIZE, (index + 1) * PAGE_SIZE).map(({ id }) => id),
					hasNextPage: index < 2,
					totalCount: collectionSize
				}))
			)
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

describe('filters', () => {
	useDatabaseTransaction(database, 'group')

	const dataset = factories.createAuthors({ collectionSize: 9, dateStep: 1, useSequentialIds: true })
	const males = sortArrayWith(
		dataset.filter(({ gender }) => gender === 'male'),
		[Sort.asc('id')]
	)

	beforeAll(async () => {
		await database.database.insert(authors).values(dataset)
	})

	it('filters the first page', async () => {
		const result = await createAuthorPager().getPage({
			query: asQuery(database.database.select().from(authors)),
			parameters: { filters: [ComparisonFilter.equal('gender', 'male')], pagination: Pagination.take(2) }
		})

		expect({ ids: result.edges.map(({ node }) => node.id), totalCount: result.totalCount }).toStrictEqual({
			ids: males.slice(0, 2).map(({ id }) => id),
			totalCount: males.length
		})
	})
})

describe('sorts on a column holding null values', () => {
	useDatabaseTransaction(database, 'group')

	// b is null on every other row
	const rawDataset = factories.createDateContainers(collectionSize)

	const createDateContainerPager = () =>
		new DrizzleCursorPager({
			database: database.database,
			table: dateContainers,
			primaryKey: { id: dateContainers.id },
			columnMapping: { id: dateContainers.id, a: dateContainers.a, b: dateContainers.b }
		})

	beforeAll(async () => {
		await database.database.insert(dateContainers).values(rawDataset)
	})

	it.each<{ sorts: Sort<keyof DateContainerRecord>[]; description: string }>([
		{ description: 'asc(b)', sorts: [Sort.asc('b')] },
		{ description: 'desc(b)', sorts: [Sort.desc('b')] },
		{ description: 'asc(b) + desc(a)', sorts: [Sort.asc('b'), Sort.desc('a')] },
		{ description: 'desc(b) + asc(a)', sorts: [Sort.desc('b'), Sort.asc('a')] }
	])('[SORT] $description: every page, in order', async ({ sorts }) => {
		// sortArrayWith orders null values like PostgreSQL: NULLS LAST in asc, NULLS FIRST in desc
		const expected = sortArrayWith(rawDataset, [...sorts, Sort.asc('id')]).map(({ id }) => id)
		const pager = createDateContainerPager()
		const ids: string[] = []
		let cursor: string | undefined
		do {
			const page = await pager.getPage({
				query: asQuery(database.database.select().from(dateContainers)),
				parameters: { sorts, pagination: Pagination.take(PAGE_SIZE, cursor) }
			})
			ids.push(...page.edges.map(({ node }) => node.id as string))
			cursor = page.hasNextPage ? page.edges.at(-1)?.cursor : undefined
		} while (cursor)

		expect(ids).toStrictEqual(expected)
	})
})

it('does not modify the given sorts', async () => {
	const sorts = [Sort.desc<keyof AuthorRecord>('createdAt')]
	await createAuthorPager().getPage({
		query: asQuery(database.database.select().from(authors)),
		parameters: { sorts, pagination: Pagination.take(1) }
	})
	expect(sorts).toStrictEqual([Sort.desc('createdAt')])
})

describe('regular expression filters', () => {
	useDatabaseTransaction(database, 'group')

	const dataset = ['Alice', 'alicia', 'Bob'].map((name) => factories.createAuthor({ name }))

	beforeAll(async () => {
		await database.database.insert(authors).values(dataset)
	})

	it.each([
		[ComparisonFilter.match<keyof AuthorRecord>('name', '^Ali'), ['Alice']],
		[ComparisonFilter.insensitiveMatch<keyof AuthorRecord>('name', '^ali'), ['Alice', 'alicia']]
	])('%p matches %p', async (filter, names) => {
		const result = await createAuthorPager().getPage({
			query: asQuery(database.database.select().from(authors)),
			parameters: { filters: [filter], sorts: [Sort.asc('name')], pagination: Pagination.take(10) }
		})
		expect(result.edges.map(({ node }) => node.name)).toStrictEqual(names)
	})
})
