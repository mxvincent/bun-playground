import { describe, expect, it } from 'bun:test'
import { Type } from 'typebox'
import { Nullable, StringEnum } from './unsafe'

describe('Nullable()', () => {
	it('makes the schema nullable', () => {
		expect(Nullable(Type.String())).toMatchObject({ nullable: true, type: 'string' })
	})

	it('keeps the default value of the base schema', () => {
		expect(Nullable(Type.String({ default: 'value' }))).toMatchObject({ default: 'value', nullable: true })
	})

	it('sets the given default value', () => {
		expect(Nullable(Type.String(), { default: null })).toMatchObject({ default: null, nullable: true })
	})
})

describe('StringEnum()', () => {
	it('creates a string enum', () => {
		expect(StringEnum(['alice', 'bob'])).toMatchObject({ enum: ['alice', 'bob'], type: 'string' })
	})

	it('sets the given default value', () => {
		expect(StringEnum(['alice', 'bob'], { default: 'alice' })).toMatchObject({ default: 'alice' })
	})
})
