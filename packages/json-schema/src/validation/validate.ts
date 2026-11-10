import type { Static, TSchema } from 'typebox'
import { Value } from 'typebox/value'
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
): (payload: unknown) => Static<T> {
	const validate = schemaCompiler.compile<Static<T>>(schema)
	return (payload: unknown): Static<T> => {
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

/** Validators by schema, one cache per coerce value: entries are released with their schema */
type Validator = (payload: unknown) => unknown
const validators = { coerce: new WeakMap<TSchema, Validator>(), strict: new WeakMap<TSchema, Validator>() }

export const getValidationFunction = <T extends TSchema>(
	schema: T,
	options: ValidationOptions
): ((payload: unknown) => Static<T>) => {
	const cache = options.coerce ? validators.coerce : validators.strict
	let validate = cache.get(schema)
	if (!validate) {
		validate = createValidationFunction<T>(schema, options)
		cache.set(schema, validate)
	}
	return validate as (payload: unknown) => Static<T>
}

export const validate = <T extends TSchema>(
	schema: T,
	value: unknown,
	options?: Partial<ValidationOptions>
): Static<T> => {
	return getValidationFunction(schema, applyDefaultOptions(options))(value)
}
