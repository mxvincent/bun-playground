import { expect, expectTypeOf, test } from 'bun:test'
import { removeUndefined } from './remove-undefined'

test('removes undefined properties', () => {
	expect(removeUndefined({ a: 1, b: undefined })).toStrictEqual({ a: 1 })
})

test('keeps null properties', () => {
	expect(removeUndefined({ a: null })).toStrictEqual({ a: null })
})

test('removes undefined properties of nested objects', () => {
	expect(removeUndefined({ a: { b: undefined, c: 1 } })).toStrictEqual({ a: { c: 1 } })
})

test('removes undefined items of arrays', () => {
	expect(removeUndefined({ a: [{ b: undefined }, undefined] })).toStrictEqual({ a: [{}] })
})

test('keeps class instances as they are', () => {
	const date = new Date(0)
	expect(removeUndefined({ date }).date).toBe(date)
})

test('types undefined properties as removed, possibly undefined ones as optional, and keeps null', () => {
	const value = { a: 1, b: undefined, c: 'c' as string | undefined, d: null as string | null, e: new Date(0) }
	expectTypeOf(removeUndefined(value)).toEqualTypeOf<{ a: number; c?: string; d: string | null; e: Date }>()
})
