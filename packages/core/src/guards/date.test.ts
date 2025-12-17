import { expect, it } from 'bun:test'
import { isDate } from './date'

it('should return true', () => {
	expect(isDate(new Date())).toBe(true)
})

it.each([undefined, null, false, '123', 123, { k: 'v' }])('should return false', (value) => {
	expect(isDate(value)).toBe(false)
})
