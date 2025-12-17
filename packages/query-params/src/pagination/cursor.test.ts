import { describe, expect, it } from 'bun:test'
import { PaginationCursorTransformer, parseCursorValue, serializeCursorValue } from './cursor'

describe('serialize cursor value', () => {
	it('should handle string', async () => {
		expect(serializeCursorValue('value')).toEqual('value')
	})
	it('should handle number', async () => {
		expect(serializeCursorValue(1)).toEqual('1')
	})
	it('should handle bigint', async () => {
		expect(serializeCursorValue(1n)).toEqual('1')
	})
	it('should handle date', async () => {
		expect(serializeCursorValue(new Date('2022-01-01T00:00:00Z'))).toEqual('2022-01-01T00:00:00.000Z')
	})
	it('should handle null', async () => {
		expect(serializeCursorValue(null)).toEqual('\0')
	})
	it('should trow type error', async () => {
		expect(() => serializeCursorValue({})).toThrowError(
			TypeError('unserializable value given as cursor part: [object Object]')
		)
	})
})

describe('parse cursor value', () => {
	it('should handle non null value', async () => {
		expect(parseCursorValue('value')).toEqual('value')
	})
	it('should handle null values', async () => {
		expect(parseCursorValue('\0')).toEqual(null)
	})
})

describe('PaginationCursorEncoder.decode()', () => {
	it('should use base64decode as default decoder', async () => {
		const transformer = new PaginationCursorTransformer(['id', 'createdAt'])
		const decoded = transformer.decode('MjAyMC0wMS0wMVQwMDowMDowMC4wMDBaLDAwMDA=')
		expect(decoded).toEqual({
			createdAt: '2020-01-01T00:00:00.000Z',
			id: '0000'
		})
	})

	it('should decode cursor from string', async () => {
		const decoder = (value: string) => value
		const transformer = new PaginationCursorTransformer(['id', 'createdAt'], {
			decoder
		})
		const decoded = transformer.decode('2020-01-01T00:00:00.000Z,0000')
		expect(decoded).toEqual({
			createdAt: '2020-01-01T00:00:00.000Z',
			id: '0000'
		})
	})
})

describe('CollectionPager.encodeCursor()', () => {
	const author = {
		id: '0000',
		name: `author-0000`,
		createdAt: new Date('2020-01-01T00:00:00.000Z'),
		age: 20,
		gender: 'male'
	}

	it('should use base64Encode as default encoder', async () => {
		const transformer = new PaginationCursorTransformer(['id', 'createdAt'])
		const cursor = transformer.encode(author)
		expect(cursor).toBe('MjAyMC0wMS0wMVQwMDowMDowMC4wMDBaLDAwMDA=')
	})

	it('should encode cursor as string', async () => {
		const encoder = (value: string) => value
		const transformer = new PaginationCursorTransformer(['id', 'createdAt'], {
			encoder
		})
		const cursor = transformer.encode(author)
		expect(cursor).toBe(`2020-01-01T00:00:00.000Z,0000`)
	})
})
