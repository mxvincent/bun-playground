import { beforeAll, describe, expect, it } from 'bun:test'
import { invariant } from '@package/core'
import { slice, sortArrayWith } from '@package/database'
import { Pagination, Sort } from '@package/query-params'
import { useDatabaseContext, useDatabaseTransaction } from '#test-helpers/database'
import { Author, DateContainer } from '#test-helpers/entities'
import { factories } from '#test-helpers/factories'
import { Pager } from './pagination'

const database = useDatabaseContext()

const collectionSize = 25

const createAuthorPager = (sorts: Sort<keyof Author>[]) => {
	const query = database.manager.createQueryBuilder(Author, 'author')
	return new Pager(Author, { query, sorts })
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
			}
		])('[SORT] $description', ({ sorts }) => {
			const dataset = sortArrayWith(rawDataset, sorts)

			it('take first page', async () => {
				const pager = createAuthorPager(sorts)
				const { cursorTransformer } = pager
				const expected = slice(dataset, { take: 10, cursorTransformer })

				const result = await pager.getPage(Pagination.take(10))

				expect(result).toStrictEqual({
					edges: expected,
					hasNextPage: true,
					totalCount: collectionSize
				})
			})

			it('take second page', async () => {
				const pager = createAuthorPager(sorts)
				const { cursorTransformer } = pager
				const expected = slice(dataset, {
					take: 10,
					skip: 10,
					cursorTransformer
				})

				const result = await pager.getPage(Pagination.take(10, cursorTransformer.encode(invariant(dataset[9]))))

				expect(result).toStrictEqual({
					edges: expected,
					hasNextPage: true,
					totalCount: collectionSize
				})
			})

			it('take last page', async () => {
				const pager = createAuthorPager(sorts)
				const { cursorTransformer } = pager
				const expected = slice(dataset, {
					take: 10,
					skip: 20,
					cursorTransformer
				})

				const result = await pager.getPage(Pagination.take(10, cursorTransformer.encode(invariant(dataset[19]))))

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
	const createDateContainerPager = (sorts: Sort<keyof DateContainer>[]) => {
		const query = database.manager.createQueryBuilder(DateContainer, 'container')
		return new Pager(DateContainer, { query, sorts })
	}

	beforeAll(async () => database.manager.insert(DateContainer, rawDataset))

	it('[SORT] asc(a) + asc (b)', async () => {
		const sorts: Sort<keyof DateContainer>[] = [Sort.asc('a'), Sort.asc('b')]
		const dataset = sortArrayWith(rawDataset, sorts)
		const pager = createDateContainerPager(sorts)
		const expected = slice(dataset, {
			take: 10,
			cursorTransformer: pager.cursorTransformer
		})

		const result = await pager.getPage(Pagination.take(10))

		expect(result).toStrictEqual({
			edges: expected,
			hasNextPage: true,
			totalCount: collectionSize
		})
	})
	it('[SORT] desc(a) + desc(b)', async () => {
		const sorts: Sort<keyof DateContainer>[] = [Sort.desc('a'), Sort.desc('b')]
		const dataset = sortArrayWith(rawDataset, sorts)
		const pager = createDateContainerPager(sorts)
		const expected = slice(dataset, {
			take: 10,
			cursorTransformer: pager.cursorTransformer
		})

		const result = await pager.getPage(Pagination.take(10))

		expect(result).toStrictEqual({
			edges: expected,
			hasNextPage: true,
			totalCount: collectionSize
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
	let pager: Pager<Author>

	beforeAll(async () => {
		await database.manager.insert(Author, dataset)
		pager = createAuthorPager([])
	})

	describe('Pager.getPage()', () => {
		it('should include `totalCount` as default behaviour', async () => {
			const connection = await pager.getPage(Pagination.take(5))

			expect(connection).toMatchObject({ totalCount: collectionSize })
		})

		it('should include `totalCount`', async () => {
			const pagination = Pagination.take(5)
			pagination.isCountRequested = true

			const connection = await pager.getPage(pagination)

			expect(connection).toMatchObject({ totalCount: collectionSize })
		})

		it('should not include `totalCount`', async () => {
			const pagination = Pagination.take(5)
			pagination.isCountRequested = false

			const connection = await pager.getPage(pagination)

			expect(connection).toMatchObject({ totalCount: null })
		})
	})
})
