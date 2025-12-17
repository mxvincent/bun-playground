import { expect, it } from 'bun:test'
import { isString } from './string'

it.each(['string', '', '123'])('should return true', (value) => {
	expect(isString(value)).toBe(true)
})

it.each([undefined, null, false, 123, new Date(), {}])('should return false', (value) => {
	expect(isString(value)).toBe(false)
})
