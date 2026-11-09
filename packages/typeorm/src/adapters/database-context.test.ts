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
