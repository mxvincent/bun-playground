import { expect, it } from 'bun:test'
import { AssertionError } from 'node:assert'
import { assertString, isString } from './string'

it.each(['string', '', '123'])('should return true', (value) => {
	expect(isString(value)).toBe(true)
})

it.each([undefined, null, false, 123, new Date(), {}])('should return false', (value) => {
	expect(isString(value)).toBe(false)
})

it('assertString returns the string', () => {
	expect(assertString('value')).toBe('value')
})

it('assertString throws when the value is not a string', () => {
	expect(() => assertString(123)).toThrow(
		expect.objectContaining({ constructor: AssertionError, message: 'Value should be a string', actual: 123 })
	)
})
