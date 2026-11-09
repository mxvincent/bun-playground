import { expect, it } from 'bun:test'
import { Sort } from '@package/query-params'
import { parseSorts } from './parse'

it.each([
	['createdAt', Sort.asc('createdAt')],
	['asc(createdAt)', Sort.asc('createdAt')],
	['desc(createdAt)', Sort.desc('createdAt')],
	['desc(user.fullName)', Sort.desc('user.fullName')],
	['description', Sort.asc('description')],
	['ascending', Sort.asc('ascending')]
])('parses %p', (queryStringParameter, sort) => {
	expect(parseSorts(queryStringParameter)).toStrictEqual([sort])
})

it('parses every sort of a repeated query string parameter', () => {
	expect(parseSorts(['id', 'desc(updatedAt)'])).toStrictEqual([Sort.asc('id'), Sort.desc('updatedAt')])
})

it('keeps the first sort of a path', () => {
	expect(parseSorts(['asc(createdAt)', 'desc(createdAt)'])).toStrictEqual([Sort.asc('createdAt')])
})

it('keeps the first sort only with getFirstOnly', () => {
	expect(parseSorts(['id', 'desc(updatedAt)'], true)).toStrictEqual([Sort.asc('id')])
})

it('ignores an invalid sort', () => {
	expect(parseSorts(['up(id)', 'desc(updatedAt)'])).toStrictEqual([Sort.desc('updatedAt')])
})

it('ignores a sort with unbalanced parentheses', () => {
	expect(parseSorts('asc(name')).toStrictEqual([])
})
