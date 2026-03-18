import { base64Encode } from '@package/core'
import { describe, expect, it } from 'bun:test'
import { PaginationCursorTransformer } from './cursor'

describe('PaginationCursorTransformer', () => {
	const author = {
		id: '0000',
		name: 'author-0000',
		createdAt: new Date('2020-01-01T00:00:00.000Z'),
		age: 20,
		gender: 'male'
	}

	describe('encode()', () => {
		it('should encode cursor as base64 JSON by default', () => {
			const transformer = new PaginationCursorTransformer(['id', 'createdAt'])
			const cursor = transformer.encode(author)
			const decoded = JSON.parse(atob(cursor))
			expect(decoded).toEqual({
				createdAt: '2020-01-01T00:00:00.000Z',
				id: '0000'
			})
		})

		it('should encode null values', () => {
			const entity = { id: '0000', optional: null }
			const transformer = new PaginationCursorTransformer(['id', 'optional'])
			const cursor = transformer.encode(entity)
			const decoded = JSON.parse(atob(cursor))
			expect(decoded).toEqual({ id: '0000', optional: null })
		})

		it('should encode numeric values as numbers', () => {
			const transformer = new PaginationCursorTransformer(['id', 'age'])
			const cursor = transformer.encode(author)
			const decoded = JSON.parse(atob(cursor))
			expect(decoded).toEqual({ age: 20, id: '0000' })
		})

		it('should use custom encoder', () => {
			const encoder = (value: string) => value
			const transformer = new PaginationCursorTransformer(['id', 'createdAt'], { encoder })
			const cursor = transformer.encode(author)
			expect(JSON.parse(cursor)).toEqual({
				createdAt: '2020-01-01T00:00:00.000Z',
				id: '0000'
			})
		})
	})

	describe('decode()', () => {
		it('should decode base64 JSON cursor by default', () => {
			const transformer = new PaginationCursorTransformer(['id', 'createdAt'])
			const cursor = base64Encode(JSON.stringify({ createdAt: '2020-01-01T00:00:00.000Z', id: '0000' }))
			const decoded = transformer.decode(cursor)
			expect(decoded).toEqual({
				createdAt: '2020-01-01T00:00:00.000Z',
				id: '0000'
			})
		})

		it('should decode null values', () => {
			const transformer = new PaginationCursorTransformer(['id', 'optional'])
			const cursor = base64Encode(JSON.stringify({ id: '0000', optional: null }))
			const decoded = transformer.decode(cursor)
			expect(decoded).toEqual({ id: '0000', optional: null })
		})

		it('should coerce numeric values to strings', () => {
			const transformer = new PaginationCursorTransformer(['id', 'age'])
			const cursor = base64Encode(JSON.stringify({ age: 20, id: '0000' }))
			const decoded = transformer.decode(cursor)
			expect(decoded).toEqual({ age: '20', id: '0000' })
		})

		it('should use custom decoder', () => {
			const decoder = (value: string) => value
			const transformer = new PaginationCursorTransformer(['id', 'createdAt'], { decoder })
			const decoded = transformer.decode('{"createdAt":"2020-01-01T00:00:00.000Z","id":"0000"}')
			expect(decoded).toEqual({
				createdAt: '2020-01-01T00:00:00.000Z',
				id: '0000'
			})
		})
	})

	describe('encode/decode roundtrip', () => {
		it('should roundtrip with string and date values', () => {
			const transformer = new PaginationCursorTransformer(['id', 'createdAt'])
			const cursor = transformer.encode(author)
			const decoded = transformer.decode(cursor)
			expect(decoded).toEqual({
				createdAt: '2020-01-01T00:00:00.000Z',
				id: '0000'
			})
		})

		it('should roundtrip with null values', () => {
			const entity = { id: '0000', optional: null }
			const transformer = new PaginationCursorTransformer(['id', 'optional'])
			const cursor = transformer.encode(entity)
			const decoded = transformer.decode(cursor)
			expect(decoded).toEqual({ id: '0000', optional: null })
		})

		it('should handle values containing commas and special characters', () => {
			const entity = { id: 'hello,world', name: 'foo,bar,baz' }
			const transformer = new PaginationCursorTransformer(['id', 'name'])
			const cursor = transformer.encode(entity)
			const decoded = transformer.decode(cursor)
			expect(decoded).toEqual({ id: 'hello,world', name: 'foo,bar,baz' })
		})
	})
})