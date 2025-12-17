import { beforeAll, describe, expect, it } from 'bun:test'
import { randomUUID } from 'node:crypto'
import { hydrate, hydratePartial, invariant, type KeyOf } from '@package/core'
import { sortArrayWith } from '@package/database'
import { Sort, SortDirection } from '@package/query-params'
import { useDatabaseContext, useDatabaseTransaction } from '#test-helpers/database'
import { Author, Post } from '#test-helpers/entities'
import { factories } from '#test-helpers/factories'
import { Sorter } from './sort'

const database = useDatabaseContext()

const collectionSize = 10
describe.each([
	{
		description: 'DATASET: use unique value to perform sort',
		collection: factories.createAuthors({
			collectionSize,
			dateStep: 1,
			useSequentialIds: true
		})
	},
	{
		description: 'DATASET: use duplicated values to perform sort',
		collection: factories.createAuthors({
			collectionSize,
			dateStep: 2,
			useSequentialIds: true
		})
	},
	{
		description: 'DATASET: non sequential id',
		collection: factories.createAuthors({
			collectionSize,
			dateStep: 3,
			useSequentialIds: false
		})
	}
])('$description', ({ collection }) => {
	useDatabaseTransaction(database, 'group')

	beforeAll(async () => {
		await database.manager.insert(Author, collection)
	})

	it('(asc) should return sorted data', async () => {
		const sorts = [Sort.asc('createdAt'), Sort.asc('id')]
		const expected = sortArrayWith<Author>(collection, sorts)
		const query = database.manager.createQueryBuilder(Author, 'author')
		const sorter = new Sorter(Author, { sorts, query })
		const result = await sorter.getSortedCollection()
		expect(result).toEqual(expected)
	})

	it('(desc) should return sorted data', async () => {
		const sorts = [Sort.desc('createdAt'), Sort.asc('id')]
		const expected = sortArrayWith<Author>(collection, sorts)
		const query = database.manager.createQueryBuilder(Author, 'author')
		const sorter = new Sorter(Author, { sorts, query })
		const result = await sorter.getSortedCollection()
		expect(result).toEqual(expected)
	})
})

describe('should sort on field containing null values', () => {
	useDatabaseTransaction(database, 'group')

	beforeAll(async () => {
		const author = hydrate(Author, {
			id: randomUUID(),
			name: 'author-0',
			gender: 'male',
			age: 33,
			createdAt: new Date('2022-01-01T00:00:00Z'),
			posts: []
		})
		await database.manager.save(author)
		await database.manager.save(
			['a', 'd', null, 'c', 'f', 'b', 'e', null].map((name) => hydratePartial(Post, { name, author }))
		)
	})

	it.each<{ direction: SortDirection; expected: Array<null | string> }>([
		{
			direction: SortDirection.ASC,
			expected: ['a', 'b', 'c', 'd', 'e', 'f', null, null]
		},
		{
			direction: SortDirection.DESC,
			expected: [null, null, 'f', 'e', 'd', 'c', 'b', 'a']
		}
	])('($direction) should sort on field containing null values', async ({ direction, expected }) => {
		const sorts = [{ path: 'name', direction }] satisfies Sort<KeyOf<Post>>[]
		const query = database.manager.createQueryBuilder(Post, 'post')
		const sorter = new Sorter(Post, { query, sorts })
		const result = await sorter.getSortedCollection()
		expect(result.map((el) => el.name)).toEqual(expected)
	})
})

describe('handle nested fields', () => {
	useDatabaseTransaction(database, 'group')

	it('should sort on nested values', async () => {
		const author = hydrate(Author, {
			id: randomUUID(),
			name: 'author-0',
			gender: 'male',
			age: 33,
			createdAt: new Date('2022-01-01T00:00:00Z'),
			posts: []
		})
		const posts = [
			hydratePartial(Post, { name: 'post-1', author }),
			hydratePartial(Post, { name: 'post-0', author }),
			hydratePartial(Post, { name: 'post-3', author }),
			hydratePartial(Post, { name: 'post-2', author })
		]
		await database.manager.save([author, ...posts])

		const sorter = new Sorter(Author, {
			query: database.manager.createQueryBuilder(Author, 'author').leftJoinAndSelect('author.posts', 'posts'),
			sorts: [
				{ path: 'name', direction: SortDirection.DESC },
				{ path: 'posts.name' as never, direction: SortDirection.ASC }
			]
		})
		const [result] = await sorter.getSortedCollection()
		for (let i = 0; i < 4; i++) {
			expect(invariant(result).posts?.at(i)?.name).toBe(`post-${i}`)
		}
	})
})
