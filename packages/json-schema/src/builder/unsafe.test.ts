import { describe, expect, it } from 'bun:test'
import { Kind, Type } from '@sinclair/typebox'
import { Nullable, StringEnum } from './unsafe'

describe('Nullable()', () => {
	it('should make schema nullable', () => {
		const schema = Nullable(Type.String())
		expect(schema).toMatchObject({
			nullable: true,
			type: 'string',
			[Kind]: 'String'
		})
	})
	it('should set string as default value', async () => {
		const schema = Nullable(Type.String({ default: 'test value' }))
		expect(schema).toMatchObject({
			default: 'test value',
			nullable: true,
			type: 'string',
			[Kind]: 'String'
		})
	})

	it('should set null as default value (from base schema)', () => {
		const schema = Nullable(Type.String({ default: null }))
		expect(schema).toMatchObject({
			nullable: true,
			type: 'string',
			default: null,
			[Kind]: 'String'
		})
	})

	it('should set null as default value (from schema modifier)', () => {
		const schema = Nullable(Type.String(), { default: null })
		expect(schema).toMatchObject({
			nullable: true,
			type: 'string',
			default: null,
			[Kind]: 'String'
		})
	})
})

describe('StringEnum()', () => {
	it('should create string enum', () => {
		const schema = StringEnum(['alice', 'bob', 'charlie'])
		expect(schema).toMatchObject({
			enum: ['alice', 'bob', 'charlie'],
			type: 'string',
			[Kind]: 'Unsafe'
		})
	})
	it('should set default value', async () => {
		const schema = StringEnum(['alice', 'bob', 'charlie'], {
			default: 'alice'
		})
		expect(schema).toMatchObject({
			default: 'alice',
			enum: ['alice', 'bob', 'charlie'],
			type: 'string',
			[Kind]: 'Unsafe'
		})
	})
})
