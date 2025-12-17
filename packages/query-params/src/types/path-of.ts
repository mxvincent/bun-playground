/**
 * Unwrap array item type
 */
type UnwrapArray<T> = T extends (infer U)[] ? U : T

/**
 * Control recursion depth
 *
 * [never, 0, 1] => allows up to 2 levels of recursion
 * [never, 0, 1, 2, 3] => allows up to 4 levels of recursion
 */
type Prev = [never, 0, 1]

/**
 * Generic allowing to get the path of a nested object
 */
export type PathOf<T, D extends number = 1> = [D] extends [never]
	? never
	: T extends object
		? {
				[K in keyof T]-?: K extends string | number ? `${K}` | `${K}.${PathOf<UnwrapArray<T[K]>, Prev[D]>}` : never
			}[keyof T]
		: never
