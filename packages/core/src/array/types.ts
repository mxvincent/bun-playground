export type NonEmptyArray<T> = [T, ...T[]]

export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[]
	? ElementType
	: never
