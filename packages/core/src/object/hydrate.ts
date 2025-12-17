export declare abstract class PlainObject {}

export type ClassConstructor<T> = {
	new (): T
}

/**
 * Transform literal object to an instance of a given class
 */
export function hydrate<T extends PlainObject>(Constructor: ClassConstructor<T>, values: T): T {
	return Object.assign(new Constructor(), values)
}

/**
 * Transform literal object to a partial instance of a given class
 */
export function hydratePartial<T extends PlainObject>(
	Constructor: ClassConstructor<T>,
	values: Partial<T>
): Partial<T> {
	return Object.assign(new Constructor(), values)
}
