import { expect, it } from 'bun:test'
import { getPostgresConnectionUri } from './data-source'

it('getPostgresConnectionUri() builds the URI from the options', () => {
	expect(
		getPostgresConnectionUri({ username: 'user', password: 'secret', host: 'db', port: 6543, database: 'app' })
	).toBe('postgres://user:secret@db:6543/app')
})

it('getPostgresConnectionUri() defaults to localhost:5432 and a database named after the user', () => {
	expect(getPostgresConnectionUri({ username: 'user', password: 'secret' })).toBe(
		'postgres://user:secret@localhost:5432/user'
	)
})
