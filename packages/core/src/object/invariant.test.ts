import { expect, test } from 'bun:test'
import { invariant } from './invariant'

test.each([0, '', false])('returns the falsy value %p', (value) => {
	expect(invariant(value)).toBe(value)
})

test.each([undefined, null])('throws on %p', (value) => {
	expect(() => invariant(value)).toThrow(TypeError)
})

test('throws with the given message', () => {
	expect(() => invariant(undefined, 'missing')).toThrow('missing')
})
