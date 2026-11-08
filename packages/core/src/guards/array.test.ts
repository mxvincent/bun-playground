import { expect, it } from 'bun:test'
import { assertArray, isArray } from './array'

it('should return true', () => {
	expect(isArray([])).toBe(true)
})

it.each([undefined, null, false, '123', 123, { k: 'v' }])('should return false', (value) => {
	expect(isArray(value)).toBe(false)
})

it('assertArray returns the array', () => {
	const value = [1]
	expect(assertArray(value)).toBe(value)
})

it('assertArray throws when the value is not an array', () => {
	expect(() => assertArray('123')).toThrow('Value should be an array')
})
