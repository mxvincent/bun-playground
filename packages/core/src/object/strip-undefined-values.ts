/** Values kept as they are: only plain objects and arrays are traversed */
type Opaque = Date | RegExp | Map<unknown, unknown> | Set<unknown> | Uint8Array | ((...args: never[]) => unknown)

type Simplify<T> = { [K in keyof T]: T[K] } & {}

/** Keys whose value can never be undefined */
type DefinedKeys<T> = { [K in keyof T]-?: undefined extends T[K] ? never : K }[keyof T]

/** Keys whose value can be undefined, but is not always undefined */
type MaybeUndefinedKeys<T> = {
	[K in keyof T]-?: undefined extends T[K] ? ([T[K]] extends [undefined] ? never : K) : never
}[keyof T]

export type StripUndefinedValues<T> = T extends Opaque
	? T
	: T extends readonly (infer U)[]
		? StripUndefinedValues<Exclude<U, undefined>>[]
		: T extends object
			? Simplify<
					{ [K in DefinedKeys<T>]: StripUndefinedValues<T[K]> } & {
						[K in MaybeUndefinedKeys<T>]?: StripUndefinedValues<Exclude<T[K], undefined>>
					}
				>
			: T

const isPlainObject = (value: object): value is Record<string, unknown> => {
	const prototype = Object.getPrototypeOf(value)
	return prototype === Object.prototype || prototype === null
}

const strip = (value: unknown): unknown => {
	if (Array.isArray(value)) {
		return value.filter((item) => item !== undefined).map(strip)
	}
	if (value !== null && typeof value === 'object' && isPlainObject(value)) {
		const result: Record<string, unknown> = {}
		for (const [key, property] of Object.entries(value)) {
			if (property !== undefined) {
				result[key] = strip(property)
			}
		}
		return result
	}
	return value
}

/**
 * Remove undefined values from plain objects and arrays, recursively.
 * Other objects (Date, Map, class instances…) are kept as they are.
 */
export const stripUndefinedValues = <T extends object>(obj: T): StripUndefinedValues<T> => {
	return strip(obj) as StripUndefinedValues<T>
}

/** @deprecated Renamed to {@link stripUndefinedValues} */
export const removeUndefined = stripUndefinedValues
