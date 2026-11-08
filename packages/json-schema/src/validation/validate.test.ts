import { describe, expect, expectTypeOf, it } from 'bun:test'
import {
	createValidationFunction,
	getValidationFunction,
	JsonSchemaValidationError,
	Schema,
	Type,
	validate
} from '../index'

describe('validate()', () => {
	it('returns a valid value', () => {
		expect(validate(Type.String(), 'value')).toBe('value')
	})

	it.each([0, NaN, {}, null, undefined, true])('throws a JsonSchemaValidationError for %p', (value) => {
		expect(() => validate(Type.String(), value)).toThrowError(JsonSchemaValidationError)
	})

	it('attaches the ajv errors and the payload to the error', () => {
		const payload = { name: 1 }
		const error = (() => {
			try {
				validate(Type.Object({ name: Type.String() }), payload)
			} catch (error) {
				return error
			}
		})()
		expect(error).toMatchObject({ payload, errors: [{ instancePath: '/name', keyword: 'type' }] })
	})

	it('applies the default values', () => {
		expect(validate(Type.Object({ name: Type.String({ default: 'default' }) }), {})).toStrictEqual({
			name: 'default'
		})
	})

	it('removes the additional properties', () => {
		const schema = Type.Object({ name: Type.String() }, { additionalProperties: false })
		expect(validate(schema, { name: 'value', other: 1 })).toStrictEqual({ name: 'value' })
	})

	it('does not coerce types by default', () => {
		expect(() => validate(Type.Number(), '123')).toThrowError(JsonSchemaValidationError)
	})

	it('coerces types when coerce is enabled', () => {
		expect(validate(Type.Number(), '123', { coerce: true })).toBe(123)
	})
})

describe('Schema.Nullable()', () => {
	const schema = Schema.Nullable(Type.String())

	it.each(['value', null])('accepts %p', (value) => {
		expect(validate(schema, value)).toBe(value)
	})

	it('rejects another type', () => {
		expect(() => validate(schema, 123)).toThrowError(JsonSchemaValidationError)
	})
})

describe('Schema.DateTime()', () => {
	it('accepts an ISO 8601 date time', () => {
		expect(validate(Schema.DateTime(), '2026-01-01T00:00:00Z')).toBe('2026-01-01T00:00:00Z')
	})

	it('rejects a date without time', () => {
		expect(() => validate(Schema.DateTime(), '2026-01-01')).toThrowError(JsonSchemaValidationError)
	})
})

describe('Schema.UUID()', () => {
	it('accepts a UUID', () => {
		const uuid = '0195f7b2-1c2d-7e3f-8a4b-5c6d7e8f9a0b'
		expect(validate(Schema.UUID(), uuid)).toBe(uuid)
	})

	it('rejects another string', () => {
		expect(() => validate(Schema.UUID(), 'not-a-uuid')).toThrowError(JsonSchemaValidationError)
	})
})

describe('getValidationFunction()', () => {
	it('reuses the validator of a schema', () => {
		const schema = Type.String()
		expect(getValidationFunction(schema, { coerce: false })).toBe(getValidationFunction(schema, { coerce: false }))
	})

	it('builds one validator per coerce option', () => {
		const schema = Type.String()
		expect(getValidationFunction(schema, { coerce: true })).not.toBe(getValidationFunction(schema, { coerce: false }))
	})
})

it('createValidationFunction() types the payload with the static type of the schema', () => {
	const validateName = createValidationFunction(Type.Object({ name: Type.String() }), { coerce: false })
	expectTypeOf(validateName).returns.toEqualTypeOf<{ name: string }>()
})
