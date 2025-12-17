import { AssertionError } from 'node:assert'

export const isArray = <T = never>(value: unknown): value is T[] => {
	return Array.isArray(value)
}

export const assertArray = <T = unknown>(value: unknown): Array<T> => {
	if (isArray(value)) {
		return value
	}
	throw new AssertionError({
		message: 'Value should be a string',
		actual: value
	})
}
