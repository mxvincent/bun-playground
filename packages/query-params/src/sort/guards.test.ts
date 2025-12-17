import { describe, expect, it } from 'bun:test'
import { isSort } from './guards'
import { SORT_DIRECTIONS } from './sort'

it.each(SORT_DIRECTIONS)('should return true', (direction) => {
	expect(isSort({ direction, path: 'key' })).toBeTruthy()
})

describe('should return false', () => {
	it('should handle null', () => {
		expect(isSort(null)).toBeFalsy()
	})
	it('should handle array', () => {
		expect(isSort([])).toBeFalsy()
	})
	it('should handle object', () => {
		expect(isSort({})).toBeFalsy()
	})
	it('should handle string', () => {
		expect(isSort('a')).toBeFalsy()
	})
	it('should handle number', () => {
		expect(isSort(1)).toBeFalsy()
	})
	it('should handle undefined', () => {
		expect(isSort(undefined)).toBeFalsy()
	})
})
