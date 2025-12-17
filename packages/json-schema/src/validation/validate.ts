import type { Static, TSchema } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'
import type { ErrorObject } from 'ajv'
import { JsonSchemaValidationError } from '../errors/validation'
import { schemaCompiler } from './ajv'

export type ValidationOptions = {
	coerce: boolean
}

const applyDefaultOptions = (options?: Partial<ValidationOptions>): ValidationOptions => ({
	coerce: options?.coerce ?? false
})

export function createValidationFunction<T extends TSchema>(
	schema: T,
	options: ValidationOptions
): (payload: unknown) => T {
	const validate = schemaCompiler.compile<T>(schema)
	return (payload: unknown): T => {
		const result = options.coerce ? Value.Convert(schema, payload) : payload
		if (validate(result) === true) {
			return result
		}
		throw new JsonSchemaValidationError('JSON schema validation failed', {
			errors: validate.errors as ErrorObject[],
			payload
		})
	}
}

const validators = new Map<
	{
		schema: TSchema
		options: ValidationOptions
	},
	(value: unknown) => unknown
>()

export const getValidationFunction = <T extends TSchema>(
	schema: T,
	options: ValidationOptions
): ((payload: unknown) => T) => {
	let validate = validators.get({ schema, options })
	if (!validate) {
		validate = createValidationFunction<T>(schema, options)
		validators.set({ schema, options }, validate)
	}
	return validate as (payload: unknown) => T
}

export const validate = <T extends TSchema>(
	schema: T,
	value: unknown,
	options?: Partial<ValidationOptions>
): Static<T> => {
	return getValidationFunction<T>(schema, applyDefaultOptions(options))(value)
}
