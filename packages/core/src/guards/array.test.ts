import { expect, it } from 'bun:test'
import { isArray } from './array'

it('should return true', () => {
	expect(isArray([])).toBe(true)
})

it.each([undefined, null, false, '123', 123, { k: 'v' }])('should return false', (value) => {
	expect(isArray(value)).toBe(false)
})
