import { expect, test } from 'bun:test'
import { invariant } from './invariant'

test.each([0, '', false])('returns the falsy value %p', (value) => {
	expect(invariant(value)).toBe(value)
})

test.each([undefined, null])('throws on %p', (value) => {
	expect(() => invariant(value)).toThrow(
		expect.objectContaining({ constructor: TypeError, message: 'Value can not be undefined.' })
	)
})

test('throws with the given message', () => {
	expect(() => invariant(undefined, 'missing')).toThrow(
		expect.objectContaining({ constructor: TypeError, message: 'missing' })
	)
})
