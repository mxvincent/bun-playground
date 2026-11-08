import { expect, test } from 'bun:test'
import { ascending, descending } from './sort'

test('ascending sorts from the lowest to the highest value', () => {
	expect([2, 3, 1, 2].sort(ascending)).toStrictEqual([1, 2, 2, 3])
})

test('descending sorts from the highest to the lowest value', () => {
	expect([2, 3, 1, 2].sort(descending)).toStrictEqual([3, 2, 2, 1])
})
