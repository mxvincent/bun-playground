import { describe, expect, it } from 'bun:test'
import { Sort } from '@package/query-params'
import { parseSorts } from './parse'

describe('return sort options', () => {
	it.each([
		['createdAt', [Sort.asc('createdAt')]],
		['asc(createdAt)', [Sort.asc('createdAt')]],
		['desc(deletedAt)', [Sort.desc('deletedAt')]],
		[
			['id', 'desc(updatedAt)'],
			[Sort.asc('id'), Sort.desc('updatedAt')]
		]
	])('%p', (inputValues, expectedResult) => {
		expect(parseSorts(inputValues)).toEqual(expectedResult)
	})
})

it('should handle patch with nested properties', () => {
	expect(parseSorts(`desc(user.fullName)`)).toEqual([Sort.desc('user.fullName')])
})

it('should return many sort options', () => {
	expect(parseSorts(['asc(createdAt)', 'desc(updatedAt)'])).toEqual([Sort.asc('createdAt'), Sort.desc('updatedAt')])
})

it('should take first when sort path is used twice', () => {
	expect(parseSorts(['asc(createdAt)', 'desc(createdAt)'])).toEqual([Sort.asc('createdAt')])
})
