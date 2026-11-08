import { expect, test } from 'bun:test'
import { reverseRecord } from './reverse-record'

test('swaps keys and values', () => {
	expect(reverseRecord({ asc: 'ASC', desc: 'DESC' })).toStrictEqual({ ASC: 'asc', DESC: 'desc' })
})
