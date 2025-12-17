import { describe, expect, it } from 'bun:test'
import { JsonSchemaValidationError, Schema, Type, validate } from '../index'

const getTypeName = (value: unknown) => {
	return Object.prototype.toString
		.call(value)
		.replace(/^\[object\s+([a-z]+)\]$/i, '$1')
		.toLowerCase()
}

const formatData = <T>(value: T): { type: string; value: T } => ({
	type: getTypeName(value),
	value
})

describe('String validation', () => {
	describe('Regular string validation', () => {
		const schema = Type.String()

		it.each(['test value'].map(formatData))('should validate $type', ({ value }) => {
			expect(validate(schema, value)).toBe(value)
		})

		it.each(
			[0, NaN, Infinity, 123, {}, null, undefined, true, false].map(formatData)
		)('should not validate $type', async ({ value }) => {
			expect(() => validate(schema, value)).toThrowError(JsonSchemaValidationError)
		})
	})
})

describe('Nullable string validation', () => {
	const schema = Schema.Nullable(Type.String())

	it.each(['test value', null].map(formatData))('should validate $type', ({ value }) => {
		expect(validate(schema, value)).toBe(value)
	})

	it.each([123, {}, undefined].map(formatData))('should not validate $type', ({ value }) => {
		expect(() => validate(schema, value)).toThrowError(JsonSchemaValidationError)
	})
})

describe('Optional type coercion', () => {
	const schema = Type.Number()
	it('should not coerce type by default', async () => {
		expect(() => validate(schema, '123')).toThrowError(JsonSchemaValidationError)
	})
	it('should coerce type by default', async () => {
		expect(validate(schema, '123', { coerce: true })).toEqual(123)
	})
})
