import { expect, it } from 'bun:test'
import { serializers } from './serializers'

it('serializes an error with its type, message and stack', () => {
	expect(serializers.error(new TypeError('failure'))).toMatchObject({
		type: 'TypeError',
		message: 'failure',
		stack: expect.stringContaining('TypeError: failure')
	})
})

it('returns a value that is not an error as is', () => {
	const value = { reason: 'failure' }
	expect(serializers.error(value)).toBe(value)
})
