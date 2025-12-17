export type ObjectConstructor<T> = {
	new (): T
}

export class ObjectLiteral {}

export type Mutable<T> = {
	-readonly [P in keyof T]: T[P]
}

export type MutableProperties<T, K extends keyof T> = {
	-readonly [P in K]: T[P]
} & Omit<T, K>

export type Optional<T> = T | undefined

export type OptionalProperties<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredProperties<T, K extends keyof T> = Omit<T, K> & {
	[P in K]-?: T[P]
}

export type NullableProperties<T> = { [K in keyof T]: T[K] | null }

export type PartialWithNullableProperties<T> = Partial<NullableProperties<T>>

export type ObjectEntry<T> = [string, T]

export type ObjectEntries<T> = ObjectEntry<T>[]

export type Dictionary<T> = { [x: string]: T }

export type KeyOf<T extends object> = Extract<keyof T, string>
