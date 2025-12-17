import { type SchemaOptions, type Static, type TSchema, type TUnsafe, Type } from '@sinclair/typebox'

/**
 * Creates a nullable version of the given schema.
 *
 * @returns The unsafe schema with nullable support.
 */
export const Nullable = <T extends TSchema>(
	schema: T,
	options?: { default?: null | Static<T> }
): TUnsafe<Static<T> | null> => {
	const unsafeSchemaOptions: SchemaOptions = {
		...schema,
		nullable: true
	}
	if (options?.default !== undefined) {
		unsafeSchemaOptions.default = options.default
	}
	return Type.Unsafe(unsafeSchemaOptions)
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
	const unsafeSchemaOptions: SchemaOptions = {
		type: 'string',
		enum: values
	}
	if (options?.default !== undefined) {
		unsafeSchemaOptions.default = options.default
	}
	return Type.Unsafe(unsafeSchemaOptions)
}
