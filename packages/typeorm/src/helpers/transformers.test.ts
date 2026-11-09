import { describe, expect, it } from 'bun:test'
import { transformers } from './transformers'

describe('date transformer', () => {
	it('writes a date as an ISO 8601 string', () => {
		expect(transformers.date.to(new Date(Date.UTC(2026, 0, 1)))).toBe('2026-01-01T00:00:00.000Z')
	})

	it('reads an ISO 8601 string as a date', () => {
		expect(transformers.date.from('2026-01-01T00:00:00.000Z')).toStrictEqual(new Date(Date.UTC(2026, 0, 1)))
	})

	it.each([null, undefined])('writes %p as is', (value) => {
		expect(transformers.date.to(value)).toBe(value)
	})

	it('reads null as null', () => {
		expect(transformers.date.from(null)).toBeNull()
	})
})

describe('decimal transformer', () => {
	it('writes a number as a base 10 string', () => {
		expect(transformers.decimal.to(1.5)).toBe('1.5')
	})

	it('reads a decimal string as a number', () => {
		expect(transformers.decimal.from('1.5')).toBe(1.5)
	})

	it.each([null, undefined])('writes %p as is', (value) => {
		expect(transformers.decimal.to(value)).toBe(value)
	})

	it('reads null as null', () => {
		expect(transformers.decimal.from(null)).toBeNull()
	})
})
