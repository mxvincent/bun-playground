import { describe, expect, it } from 'bun:test'
import { Sort } from '@package/query-params'
import { serializeSort, serializeSorts } from './serialize'

describe('should serialize sort', () => {
	it.each([
		{
			sort: Sort.asc('id'),
			output: 'asc(id)'
		},
		{
			sort: Sort.desc('id'),
			output: 'desc(id)'
		}
	])('$output', async ({ sort, output }) => {
		expect(serializeSort(sort)).toStrictEqual(output)
	})
})

it('should serialize many sorts', async () => {
	expect(serializeSorts([Sort.desc('createdAt'), Sort.asc('id')])).toEqual(['desc(createdAt)', 'asc(id)'])
})
