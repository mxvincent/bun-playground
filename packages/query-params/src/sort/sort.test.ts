import { expect, it } from 'bun:test'
import { Sort, SortDirection } from './sort'

it.each([
	[Sort.asc, SortDirection.ASC],
	[Sort.desc, SortDirection.DESC]
] as const)('%p creates a sort with the %p direction', (factory, direction) => {
	expect(factory('path')).toStrictEqual(new Sort(direction, 'path'))
})

it('toString() returns the direction and the path', () => {
	expect(Sort.desc('path').toString()).toBe('desc:path')
})
