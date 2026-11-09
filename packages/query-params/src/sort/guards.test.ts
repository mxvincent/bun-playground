import { expect, it } from 'bun:test'
import { isSort } from './guards'
import { SORT_DIRECTIONS, Sort } from './sort'

it.each(SORT_DIRECTIONS)('accepts a Sort instance with the %p direction', (direction) => {
	expect(isSort(new Sort(direction, 'key'))).toBe(true)
})

it('accepts an object with a direction and a path', () => {
	expect(isSort({ direction: 'asc', path: 'key' })).toBe(true)
})

it.each([[null], ['asc:key'], [{ direction: 'up', path: 'key' }], [{ direction: 'asc' }]])('rejects %p', (value) => {
	expect(isSort(value)).toBe(false)
})
