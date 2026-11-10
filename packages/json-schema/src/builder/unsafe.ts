import { type Static, type TSchema, type TSchemaOptions, type TUnsafe, Type } from 'typebox'

/**
 * Creates a nullable version of the given schema.
 *
 * @returns The unsafe schema with nullable support.
 */
export const Nullable = <T extends TSchema>(
	schema: T,
	options?: { default?: null | Static<T> }
): TUnsafe<Static<T> | null> => {
	const nullableSchema: TSchema & { nullable: true; default?: unknown } = {
		...schema,
		nullable: true
	}
	if (options?.default !== undefined) {
		nullableSchema.default = options.default
	}
	return Type.Unsafe(nullableSchema)
}

/**
 * Creates a string enum with the given values and options.
 *
 * @template T - The type of the values in the enum.
 * @returns {TUnsafe<T[number]>} - The unsafe enum.
 */
export const StringEnum = <T extends ReadonlyArray<string>>(
	values: readonly [...T],
	options?: { default?: T[number] }
): TUnsafe<T[number]> => {
	const unsafeSchemaOptions: TSchemaOptions = {
		type: 'string',
		enum: values
	}
	if (options?.default !== undefined) {
		unsafeSchemaOptions.default = options.default
	}
	return Type.Unsafe(unsafeSchemaOptions)
}
