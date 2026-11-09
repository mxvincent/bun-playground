import { beforeAll, describe, expect, it } from 'bun:test'
import { invariant } from '@package/core'
import { Pagination, type PaginationCursorTransformer, Sort } from '@package/query-params'
import { type Author, createAuthors, createDateContainers, type DateContainer, slice } from '../helpers/test-helpers'
import { ArrayPager } from './pagination'
import { sortArrayWith } from './sort'

const DATASET_SIZE = 10
const PAGE_SIZE = 3

describe('Pager.getPage()', () => {
	describe.each<{ dataset: Author[]; description: string }>([
		{
			description: `sequential id's, unique createdAt`,
			dataset: createAuthors(DATASET_SIZE)
		},
		{
			description: `sequential id's, duplicated createdAt`,
			dataset: createAuthors(DATASET_SIZE, 2)
		},
		{
			description: `random ids, duplicated createdAt`,
			dataset: createAuthors(DATASET_SIZE, 3, false)
		}
	])('[resources] $description', ({ dataset }) => {
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
			let resources: Author[]
			let pager: ArrayPager<Author>
			let cursorTransformer: PaginationCursorTransformer<Author>

			beforeAll(() => {
				// The pager breaks ties with asc(id) when the sorts do not include id
				resources = sortArrayWith(dataset, sorts.some(({ path }) => path === 'id') ? sorts : [...sorts, Sort.asc('id')])
				pager = new ArrayPager(resources, { filters: [], sorts })
				cursorTransformer = pager.cursorTransformer
			})

			// Pages of PAGE_SIZE items: the cursor of a page is the last item of the previous one
			const PAGES = Array.from({ length: Math.ceil(DATASET_SIZE / PAGE_SIZE) }, (_, index) => index + 1)

			it.each(PAGES)('page %p', async (page) => {
				const skip = PAGE_SIZE * (page - 1)
				const cursor = skip > 0 ? cursorTransformer.encode(invariant(resources[skip - 1])) : undefined

				const result = await pager.getPage(Pagination.take(PAGE_SIZE, cursor))

				expect(result).toStrictEqual({
					edges: slice(resources, { take: PAGE_SIZE, skip, cursorTransformer }),
					hasNextPage: skip + PAGE_SIZE < DATASET_SIZE,
					totalCount: DATASET_SIZE
				})
			})
		})
	})
})

describe('should allow pagination when sort is done with a field that contain null values', () => {
	const resources = createDateContainers(DATASET_SIZE)

	describe.each<{ sorts: Sort<keyof DateContainer>[]; description: string }>([
		{ description: 'asc(a) + asc(b)', sorts: [Sort.asc('a'), Sort.asc('b')] },
		{ description: 'desc(a) + desc(b)', sorts: [Sort.desc('a'), Sort.desc('b')] },
		{ description: 'asc(b) + asc(a)', sorts: [Sort.asc('b'), Sort.asc('a')] },
		{ description: 'desc(b) + desc(a)', sorts: [Sort.desc('b'), Sort.desc('a')] }
	])('[SORT] $description', ({ sorts }) => {
		const dataset = sortArrayWith(resources, sorts)

		it('take first page', async () => {
			const pager = new ArrayPager(resources, { filters: [], sorts })
			const expected = slice(dataset, {
				take: PAGE_SIZE,
				cursorTransformer: pager.cursorTransformer
			})

			const result = await pager.getPage(Pagination.take(PAGE_SIZE))

			expect(result).toStrictEqual({
				edges: expected,
				hasNextPage: true,
				totalCount: DATASET_SIZE
			})
		})

		it('take second page (cursor crosses null values)', async () => {
			const pager = new ArrayPager(resources, { filters: [], sorts })
			const { cursorTransformer } = pager
			const expected = slice(dataset, {
				take: PAGE_SIZE,
				skip: PAGE_SIZE,
				cursorTransformer
			})

			const result = await pager.getPage(
				Pagination.take(PAGE_SIZE, cursorTransformer.encode(invariant(dataset[PAGE_SIZE - 1])))
			)

			expect(result).toStrictEqual({
				edges: expected,
				hasNextPage: true,
				totalCount: DATASET_SIZE
			})
		})

		it('take last page', async () => {
			const pager = new ArrayPager(resources, { filters: [], sorts })
			const { cursorTransformer } = pager
			const skipCount = DATASET_SIZE - PAGE_SIZE
			const expected = slice(dataset, {
				take: PAGE_SIZE,
				skip: skipCount,
				cursorTransformer
			})

			const result = await pager.getPage(
				Pagination.take(PAGE_SIZE, cursorTransformer.encode(invariant(dataset[skipCount - 1])))
			)

			expect(result).toStrictEqual({
				edges: expected,
				hasNextPage: false,
				totalCount: DATASET_SIZE
			})
		})
	})
})
