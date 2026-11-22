import { expect, it, test } from 'bun:test'
import { PaginationCursorTransformer } from '@package/query-params'
import { InvalidSliceOptionError } from '../errors'
import { type Author, createAuthors, slice } from './test-helpers'

it('createAuthors() spreads the authors over every gender', () => {
	expect(createAuthors(3).map(({ gender }) => gender)).toStrictEqual(['female', 'male', 'unknown'])
})

test.each<{ size: number; take: number; option: string; message: string; description: string }>([
	{
		size: 0,
		take: 1,
		option: 'collection',
		message: 'collection can not be empty',
		description: 'an empty collection'
	},
	{ size: 3, take: 0, option: 'take', message: 'take parameter should be >= 1', description: 'a take below 1' }
])('slice() rejects $description', ({ size, take, option, message }) => {
	const cursorTransformer = new PaginationCursorTransformer<Author>(['id'])
	const call = () => slice(createAuthors(size), { take, cursorTransformer })
	expect(call).toThrow(InvalidSliceOptionError)
	expect(call).toThrow(expect.objectContaining({ option }))
	expect(call).toThrow(message)
})
