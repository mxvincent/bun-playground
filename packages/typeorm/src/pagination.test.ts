import { beforeAll, describe, expect, it } from 'bun:test'
import { invariant } from '@package/core'
import { slice, sortArrayWith } from '@package/database'
import { Pagination, PaginationCursorTransformer, Sort } from '@package/query-params'
import { useDatabaseContext, useDatabaseTransaction } from '#test-helpers/database'
import { Author, DateContainer } from '#test-helpers/entities'
import { factories } from '#test-helpers/factories'
import { mergePrimaryKeySorts } from './helpers/sortPath'
import { Pager } from './pagination'

const database = useDatabaseContext()

const collectionSize = 25

const createAuthorPager = () => {
	const query = database.manager.createQueryBuilder(Author, 'author')
	return new Pager(Author, { query })
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

		describe.each<{ sorts: Sort<keyof Author>[]; description: string }>([
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
		])('[SORT] $description', ({ sorts }) => {
			const dataset = sortArrayWith(rawDataset, sorts)
			const resolvedSorts = mergePrimaryKeySorts(sorts, ['id'])
			const cursorTransformer = new PaginationCursorTransformer<Author>(resolvedSorts.map(({ path }) => path))

			it('take first page', async () => {
				const pager = createAuthorPager()
				const expected = slice(dataset, { take: 10, cursorTransformer })

				const result = await pager.getPage({ pagination: Pagination.take(10), sorts })

				expect(result).toStrictEqual({
					edges: expected,
					hasNextPage: true,
					totalCount: collectionSize
				})
			})

			it('take second page', async () => {
				const pager = createAuthorPager()
				const expected = slice(dataset, {
					take: 10,
					skip: 10,
					cursorTransformer
				})

				const result = await pager.getPage({
					pagination: Pagination.take(10, cursorTransformer.encode(invariant(dataset[9]))),
					sorts
				})

				expect(result).toStrictEqual({
					edges: expected,
					hasNextPage: true,
					totalCount: collectionSize
				})
			})

			it('take last page', async () => {
				const pager = createAuthorPager()
				const expected = slice(dataset, {
					take: 10,
					skip: 20,
					cursorTransformer
				})

				const result = await pager.getPage({
					pagination: Pagination.take(10, cursorTransformer.encode(invariant(dataset[19]))),
					sorts
				})

				expect(result).toStrictEqual({
					edges: expected,
					hasNextPage: false,
					totalCount: collectionSize
				})
			})
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

	describe.each<{ sorts: Sort<keyof DateContainer>[]; description: string }>([
		{ description: 'asc(a) + asc(b)', sorts: [Sort.asc('a'), Sort.asc('b')] },
		{ description: 'desc(a) + desc(b)', sorts: [Sort.desc('a'), Sort.desc('b')] },
		{ description: 'asc(b) + asc(a)', sorts: [Sort.asc('b'), Sort.asc('a')] },
		{ description: 'desc(b) + desc(a)', sorts: [Sort.desc('b'), Sort.desc('a')] }
	])('[SORT] $description', ({ sorts }) => {
		const dataset = sortArrayWith(rawDataset, sorts)
		const resolvedSorts = mergePrimaryKeySorts(sorts, ['id'])
		const cursorTransformer = new PaginationCursorTransformer<DateContainer>(resolvedSorts.map(({ path }) => path))

		it('take first page', async () => {
			const pager = createDateContainerPager()
			const expected = slice(dataset, {
				take: 10,
				cursorTransformer
			})

			const result = await pager.getPage({ pagination: Pagination.take(10), sorts })

			expect(result).toStrictEqual({
				edges: expected,
				hasNextPage: true,
				totalCount: collectionSize
			})
		})

		it('take second page (cursor crosses null values)', async () => {
			const pager = createDateContainerPager()
			const expected = slice(dataset, {
				take: 10,
				skip: 10,
				cursorTransformer
			})

			const result = await pager.getPage({
				pagination: Pagination.take(10, cursorTransformer.encode(invariant(dataset[9]))),
				sorts
			})

			expect(result).toStrictEqual({
				edges: expected,
				hasNextPage: true,
				totalCount: collectionSize
			})
		})

		it('take last page', async () => {
			const pager = createDateContainerPager()
			const expected = slice(dataset, {
				take: 10,
				skip: 20,
				cursorTransformer
			})

			const result = await pager.getPage({
				pagination: Pagination.take(10, cursorTransformer.encode(invariant(dataset[19]))),
				sorts
			})

			expect(result).toStrictEqual({
				edges: expected,
				hasNextPage: false,
				totalCount: collectionSize
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