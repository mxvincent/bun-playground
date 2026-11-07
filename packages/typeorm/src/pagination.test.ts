import { beforeAll, describe, expect, it } from 'bun:test'
import type { ObjectLiteral } from '@package/core'
import { sortArrayWith } from '@package/database'
import { ComparisonFilter, type Page, Pagination, Sort } from '@package/query-params'
import { useDatabaseContext, useDatabaseTransaction } from '#test-helpers/database'
import { Author, DateContainer } from '#test-helpers/entities'
import { factories } from '#test-helpers/factories'
import { type GetPageOptions, Pager } from './pagination'

const database = useDatabaseContext()

const collectionSize = 25
const pageSize = 10

const createAuthorPager = () => {
	const query = database.manager.createQueryBuilder(Author, 'author')
	return new Pager(Author, { query })
}

/**
 * Walk through every page the way a client does: each page is requested with the cursor of the
 * last edge of the previous one
 */
const getAllPages = async <T extends ObjectLiteral>(
	pager: Pager<T>,
	options: Omit<GetPageOptions<T>, 'pagination'>
): Promise<Page<T>[]> => {
	const pages: Page<T>[] = []
	let cursor: string | undefined
	do {
		const page = await pager.getPage({ ...options, pagination: Pagination.take(pageSize, cursor) })
		pages.push(page)
		cursor = page.hasNextPage ? page.edges.at(-1)?.cursor : undefined
	} while (cursor)
	return pages
}

/**
 * Expected pages: the sorted dataset split into chunks of `pageSize`
 */
const expectPages = <T extends ObjectLiteral>(pages: Page<T>[], sortedDataset: T[]) => {
	const chunks = Array.from({ length: Math.ceil(sortedDataset.length / pageSize) }, (_, index) =>
		sortedDataset.slice(index * pageSize, (index + 1) * pageSize)
	)
	expect(pages.map((page) => page.edges.map(({ node }) => node))).toStrictEqual(chunks)
	expect(pages.map((page) => page.hasNextPage)).toStrictEqual(chunks.map((_, index) => index < chunks.length - 1))
	expect(pages.map((page) => page.totalCount)).toStrictEqual(chunks.map(() => sortedDataset.length))
}

describe('Pager.getPage()', () => {
	describe.each<{ rawDataset: Author[]; description: string }>([
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

		beforeAll(() => database.manager.insert(Author, rawDataset))

		it.each<{ sorts: Sort<keyof Author>[]; description: string }>([
			{
				description: 'asc(id)',
				sorts: [Sort.asc('id')]
			},
			{
				description: 'desc(id)',
				sorts: [Sort.desc('id')]
			},
			{
				description: 'asc(createdAt)',
				sorts: [Sort.asc('createdAt')]
			},
			{
				description: 'desc(createdAt)',
				sorts: [Sort.desc('createdAt')]
			},
			{
				description: 'asc(createdAt) + asc(id)',
				sorts: [Sort.asc('createdAt'), Sort.asc('id')]
			},
			{
				description: 'desc(createdAt) + desc(id)',
				sorts: [Sort.desc('createdAt'), Sort.desc('id')]
			},
			{
				description: 'asc(createdAt) + desc(id)',
				sorts: [Sort.asc('createdAt'), Sort.desc('id')]
			},
			{
				description: 'desc(createdAt) + asc(id)',
				sorts: [Sort.desc('createdAt'), Sort.asc('id')]
			},
			{
				description: 'asc(gender) + asc(createdAt) + asc(id)',
				sorts: [Sort.asc('gender'), Sort.asc('createdAt'), Sort.asc('id')]
			},
			{
				description: 'desc(gender) + desc(createdAt) + desc(id)',
				sorts: [Sort.desc('gender'), Sort.desc('createdAt'), Sort.desc('id')]
			}
		])('[SORT] $description: walks through every page', async ({ sorts }) => {
			const pages = await getAllPages(createAuthorPager(), { sorts })

			expectPages(pages, sortArrayWith(rawDataset, sorts))
		})

		it.each<{ sorts: Sort<keyof Author>[]; description: string }>([
			{ description: 'asc(gender)', sorts: [Sort.asc('gender')] },
			{ description: 'desc(gender)', sorts: [Sort.desc('gender')] }
		])('[SORT] $description: breaks ties by primary key, ascending', async ({ sorts }) => {
			const pages = await getAllPages(createAuthorPager(), { sorts })

			expectPages(pages, sortArrayWith(rawDataset, [...sorts, Sort.asc('id')]))
		})
	})
})

describe('should allow pagination when sort is done with a field that contain null values', () => {
	useDatabaseTransaction(database, 'group')

	const rawDataset = factories.createDateContainers(collectionSize)
	const createDateContainerPager = () => {
		const query = database.manager.createQueryBuilder(DateContainer, 'container')
		return new Pager(DateContainer, { query })
	}

	beforeAll(async () => database.manager.insert(DateContainer, rawDataset))

	it.each<{ sorts: Sort<keyof DateContainer>[]; description: string }>([
		{ description: 'asc(a) + asc(b)', sorts: [Sort.asc('a'), Sort.asc('b')] },
		{ description: 'desc(a) + desc(b)', sorts: [Sort.desc('a'), Sort.desc('b')] },
		{ description: 'asc(b) + asc(a)', sorts: [Sort.asc('b'), Sort.asc('a')] },
		{ description: 'desc(b) + desc(a)', sorts: [Sort.desc('b'), Sort.desc('a')] }
	])('[SORT] $description: walks through every page, cursors crossing null values', async ({ sorts }) => {
		const pages = await getAllPages(createDateContainerPager(), { sorts })

		expectPages(pages, sortArrayWith(rawDataset, sorts))
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
		await database.manager.insert(Author, dataset)
	})

	describe('Pager.getPage()', () => {
		it('should include `totalCount` as default behaviour', async () => {
			const pager = createAuthorPager()
			const connection = await pager.getPage({ pagination: Pagination.take(5) })

			expect(connection).toMatchObject({ totalCount: collectionSize })
		})

		it('should include `totalCount`', async () => {
			const pager = createAuthorPager()
			const pagination = Pagination.take(5)
			pagination.isCountRequested = true

			const connection = await pager.getPage({ pagination })

			expect(connection).toMatchObject({ totalCount: collectionSize })
		})

		it('should not include `totalCount`', async () => {
			const pager = createAuthorPager()
			const pagination = Pagination.take(5)
			pagination.isCountRequested = false

			const connection = await pager.getPage({ pagination })

			expect(connection).toMatchObject({ totalCount: null })
		})
	})
})

describe('a Pager is reusable across calls', () => {
	useDatabaseTransaction(database, 'group')

	const dataset = factories.createAuthors({
		collectionSize,
		dateStep: 2,
		useSequentialIds: false
	})

	beforeAll(async () => {
		await database.manager.insert(Author, dataset)
	})

	it('should apply only the sorts of the current call', async () => {
		const pager = createAuthorPager()
		const sorts = [Sort.asc('gender'), Sort.desc('createdAt')] satisfies Sort<keyof Author>[]

		await getAllPages(pager, { sorts: [Sort.asc('createdAt')] })
		const pages = await getAllPages(pager, { sorts })

		expectPages(pages, sortArrayWith(dataset, sorts))
	})

	it('should apply only the filters of the current call', async () => {
		const pager = createAuthorPager()
		const femaleCount = dataset.filter((author) => author.gender === 'female').length

		const filtered = await pager.getPage({
			pagination: Pagination.take(pageSize),
			filters: [ComparisonFilter.equal('gender', 'female')]
		})
		const unfiltered = await pager.getPage({ pagination: Pagination.take(pageSize) })

		expect(filtered.totalCount).toBe(femaleCount)
		expect(unfiltered.totalCount).toBe(collectionSize)
	})

	it('should not modify the query given to the constructor', async () => {
		const query = database.manager.createQueryBuilder(Author, 'author')
		const pager = new Pager(Author, { query })

		await pager.getPage({
			pagination: Pagination.take(pageSize),
			sorts: [Sort.asc('createdAt')],
			filters: [ComparisonFilter.equal('gender', 'female')]
		})

		expect(query.getSql()).toBe(database.manager.createQueryBuilder(Author, 'author').getSql())
	})
})
