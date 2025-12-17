import { AssertionError } from 'node:assert'

export const isString = (value: unknown): value is string => {
	return typeof value === 'string'
}

export const assertString = (value: unknown): string => {
	if (isString(value)) {
		return value
	}
	throw new AssertionError({
		message: 'Value should be a string',
		actual: value
	})
}
