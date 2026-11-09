import { expect, it } from 'bun:test'
import { createAuthors } from './test-helpers'

it('createAuthors() spreads the authors over every gender', () => {
	expect(createAuthors(3).map(({ gender }) => gender)).toStrictEqual(['female', 'male', 'unknown'])
})
