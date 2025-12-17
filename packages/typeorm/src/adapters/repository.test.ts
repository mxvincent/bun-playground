import { beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { randomUUID } from 'node:crypto'
import type { KeyOf } from '@package/core'
import { PageQueryParameters, Pagination } from '@package/query-params'
import { In } from 'typeorm'
import { useDatabaseContext, useDatabaseTransaction } from '#test-helpers/database'
import { Author } from '#test-helpers/entities'
import { factories } from '#test-helpers/factories'
import { TypeormResourceNotFoundError } from '../errors/resource-not-found'
import { Pager } from '../pagination'
import { TypeormRepository } from './repository'

const database = useDatabaseContext()
useDatabaseTransaction(database, 'test')
const repository = new TypeormRepository(database, Author)

describe('Repository.getPage()', () => {
	it('should create  query builder', async () => {
		const createQueryBuilderSpy = spyOn(database.manager, 'createQueryBuilder')
		const getPageSpy = spyOn(Pager.prototype, 'getPage')
		const options = new PageQueryParameters<KeyOf<Author>>({
			pagination: Pagination.take(10)
		})
		await repository.getPage(options)
		expect(createQueryBuilderSpy).toHaveBeenCalledWith(Author, 'root')
		expect(getPageSpy).toHaveBeenCalledWith(options.pagination)
	})

	it('should return 10 first records', async () => {
		await database.manager.save(
			Author,
			factories.createAuthors({
				collectionSize: 25,
				dateStep: 1,
				useSequentialIds: true
			})
		)
		const page = await repository.getPage(
			new PageQueryParameters<KeyOf<Author>>({
				pagination: Pagination.take(10)
			})
		)
		expect(page.edges).toHaveLength(10)
	})
})

describe('Repository.findMany()', () => {
	it('should return empty array', async () => {
		const result = await repository.findMany({ name: 'Alice' })
		expect(result).toBeInstanceOf(Array)
		expect(result).toHaveLength(0)
	})

	it('should return records', async () => {
		await database.manager.insert(Author, [
			factories.createAuthor({ name: 'Alice' }),
			factories.createAuthor({ name: 'Alice' }),
			factories.createAuthor({ name: 'Bob' }),
			factories.createAuthor({ name: 'Bob' }),
			factories.createAuthor({ name: 'Bob' })
		])

		const result = await repository.findMany({ name: In(['Alice', 'Bob']) })

		expect(result).toHaveLength(5)
	})
})

describe('Repository.findOne()', () => {
	it('should return record', async () => {
		const id = randomUUID()
		await database.manager.insert(Author, factories.createAuthor({ id, name: 'Alice' }))
		expect(await repository.findOne({ id })).toBeInstanceOf(Author)
	})

	it('should return null', async () => {
		const result = await repository.findOne({ id: randomUUID() })
		expect(result).toBeNull()
	})
})

describe('Repository.findOneOrFail()', () => {
	const findOrFailSpy = spyOn(TypeormRepository.prototype, 'findOneOrFail')
	beforeEach(async () => {
		findOrFailSpy.mockClear()
	})

	it('should return record', async () => {
		const id = randomUUID()
		await database.manager.insert(Author, factories.createAuthor({ id }))
		const options = { id }
		expect(await repository.findOneOrFail(options)).toBeInstanceOf(Author)
		expect(findOrFailSpy).toHaveBeenCalledTimes(1)
		expect(findOrFailSpy).toHaveBeenCalledWith(options)
	})

	it('should throw `ResourceNotFoundError`', async () => {
		const id = randomUUID()
		const options = { id }
		await expect(repository.findOneOrFail(options)).rejects.toStrictEqual(
			TypeormResourceNotFoundError.format('Author', id)
		)
		expect(findOrFailSpy).toHaveBeenCalledTimes(1)
		expect(findOrFailSpy).toHaveBeenCalledWith(options)
	})
})

describe('Repository.create()', () => {
	const payload: Partial<Author> = {
		name: 'alice',
		gender: 'female'
	}

	it('should return user instance', async () => {
		const record = await repository.create(payload)
		expect(record).toBeInstanceOf(Author)
	})

	it('should create database record', async () => {
		const record = await repository.create(payload)
		expect(await database.manager.countBy(Author, { id: record.id })).toBe(1)
	})
})

describe('Repository.update()', () => {
	let author: Author

	beforeEach(async () => {
		author = factories.createAuthor()
		await database.manager.insert(Author, author)
	})

	it('should update in memory record', async () => {
		await repository.update(author, { name: 'new-username' })
		expect(author).toHaveProperty('name', 'new-username')
	})

	it('should update database record', async () => {
		await repository.update(author, { name: 'new-username' })
		const record = await repository.findOne({ id: author.id })
		expect(record).toHaveProperty('name', 'new-username')
	})

	it('should return record instance', async () => {
		await repository.update(author, { name: 'new-username' })
		expect(await repository.update(author, { name: 'new-username' })).toBe(author)
	})

	it('should fail when trying to update non existing record', async () => {
		author = factories.createAuthor()
		await expect(repository.update(author, { name: 'new-username' })).rejects.toStrictEqual(
			TypeormResourceNotFoundError.format('Author', author.id)
		)
	})
})

describe('Repository.delete()', () => {
	it('should throw an error when user not exists', async () => {
		const author = factories.createAuthor()
		await expect(repository.delete(author)).rejects.toStrictEqual(
			TypeormResourceNotFoundError.format('Author', author.id)
		)
	})

	it('should delete database record', async () => {
		const author = factories.createAuthor()
		await database.manager.insert(Author, author)
		await repository.delete(author)
		expect(await database.manager.findOneBy(Author, { id: author.id })).toBeNull()
	})

	it('should return record', async () => {
		const author = factories.createAuthor()
		await database.manager.insert(Author, author)
		expect(await repository.delete(author)).toBe(author)
	})
})
