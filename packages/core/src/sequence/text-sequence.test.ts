import { expect, test } from 'bun:test'
import { TextSequence } from './text-sequence'

test('generates padded values prefixed by the name', () => {
	const sequence = new TextSequence('user')
	expect([sequence.next(), sequence.next(3)]).toStrictEqual(['user-00000000', 'user-001'])
})
