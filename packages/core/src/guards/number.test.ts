import { expect, it } from 'bun:test'
import { isNumber } from './number'

it.each([-1, 0, 1, 1.23])('should return true', (value) => {
	expect(isNumber(value)).toBe(true)
})

it.each([undefined, null, false, '123', NaN])('should return false', (value) => {
	expect(isNumber(value)).toBe(false)
})
