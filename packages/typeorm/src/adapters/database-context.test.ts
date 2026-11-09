import { afterEach, describe, expect, it } from 'bun:test'
import { testDataSource } from '#test-helpers/data-source'
import { useDatabaseContext } from '#test-helpers/database'
import { Author } from '#test-helpers/entities'
import { factories } from '#test-helpers/factories'
import { TypeormDatabaseContext } from './database-context'

// Initializes the data source; the transactions below run on their own context and commit for real
useDatabaseContext()

describe('TypeormDatabaseContext.transaction()', () => {
	const author = factories.createAuthor()
	const isPersisted = async () => (await testDataSource.manager.countBy(Author, { id: author.id })) === 1

	afterEach(async () => {
		await testDataSource.manager.delete(Author, { id: author.id })
	})

	it('commits the changes of the callback', async () => {
		const context = new TypeormDatabaseContext(testDataSource)
		await context.transaction((manager) => manager.insert(Author, author))
		expect(await isPersisted()).toBe(true)
	})

	it('rolls back the changes of a failing callback and rethrows its error', async () => {
		const context = new TypeormDatabaseContext(testDataSource)
		const failure = context.transaction(async (manager) => {
			await manager.insert(Author, author)
			throw new Error('failure')
		})
		await expect(failure).rejects.toThrow('failure')
		expect(await isPersisted()).toBe(false)
	})

	it('returns the result of the callback', async () => {
		const context = new TypeormDatabaseContext(testDataSource)
		expect(await context.transaction(async () => 'result')).toBe('result')
	})

	it('ends the transaction once the callback is done', async () => {
		const context = new TypeormDatabaseContext(testDataSource)
		await context.transaction(async () => undefined)
		expect(context.isTransactionActive).toBe(false)
	})
})

describe('nested TypeormDatabaseContext.transaction()', () => {
	const outer = factories.createAuthor()
	const inner = factories.createAuthor()
	const isPersisted = async (author: Author) => (await testDataSource.manager.countBy(Author, { id: author.id })) === 1

	afterEach(async () => {
		await testDataSource.manager.delete(Author, [outer.id, inner.id])
	})

	it('keeps the outer transaction active after the inner one', async () => {
		const context = new TypeormDatabaseContext(testDataSource)
		let isOuterActive = false
		await context.transaction(async () => {
			await context.transaction(async () => undefined)
			isOuterActive = context.isTransactionActive
		})
		expect(isOuterActive).toBe(true)
	})

	it('rolls back the inner changes when the outer callback fails', async () => {
		const context = new TypeormDatabaseContext(testDataSource)
		const failure = context.transaction(async (manager) => {
			await context.transaction((innerManager) => innerManager.insert(Author, inner))
			await manager.insert(Author, outer)
			throw new Error('failure')
		})
		await expect(failure).rejects.toThrow('failure')
		expect([await isPersisted(inner), await isPersisted(outer)]).toEqual([false, false])
	})

	it('keeps the outer changes when the inner callback fails', async () => {
		const context = new TypeormDatabaseContext(testDataSource)
		await context.transaction(async (manager) => {
			await manager.insert(Author, outer)
			await context
				.transaction(async (innerManager) => {
					await innerManager.insert(Author, inner)
					throw new Error('inner failure')
				})
				.catch(() => undefined)
		})
		expect([await isPersisted(inner), await isPersisted(outer)]).toEqual([false, true])
	})
})
