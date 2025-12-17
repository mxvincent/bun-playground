import type { JsonObject } from '../json/types'

type RemoveUndefined<T> = T extends object
	? {
			[P in keyof T]: T[P] extends undefined ? never : RemoveUndefined<NonNullable<T[P]>>
		}
	: T

export const removeUndefined = <T extends object>(obj: T): RemoveUndefined<T> => {
	if (typeof obj !== 'object') {
		throw new TypeError('Expected an object')
	}
	if (obj === null) {
		return obj as RemoveUndefined<T>
	}
	if (Array.isArray(obj)) {
		return obj
			.filter((item): item is NonNullable<typeof item> => item !== undefined)
			.map((item) => removeUndefined(item as object)) as RemoveUndefined<T>
	}
	return Object.entries(obj).reduce((acc, [key, value]) => {
		if (value !== undefined) {
			if (value !== null && typeof value === 'object') {
				acc[key] = removeUndefined(value)
			} else {
				acc[key] = value
			}
		}
		return acc
	}, {} as JsonObject) as RemoveUndefined<T>
}
