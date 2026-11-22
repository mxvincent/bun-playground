import type { ComponentContext } from '#/helpers/context'

/**
 * A value, or a function computing it from the context of the component it applies to
 */
export type Resolvable<T> = T | ((context: ComponentContext) => T)

/**
 * Resolve a value for a component
 */
export const resolve = <T>(value: Resolvable<T> | undefined, context: ComponentContext): T | undefined => {
	return typeof value === 'function' ? (value as (context: ComponentContext) => T)(context) : value
}
