import { expect, test } from 'bun:test'
import { range } from './range'

test('includes both bounds', () => {
	expect(range(1, 3)).toStrictEqual([1, 2, 3])
})

test('uses the step between values', () => {
	expect(range(0, 10, 5)).toStrictEqual([0, 5, 10])
})
