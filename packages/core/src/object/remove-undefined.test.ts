import { expect, test } from 'bun:test'
import { removeUndefined } from './remove-undefined'

test('removes undefined properties', () => {
	expect<unknown>(removeUndefined({ a: 1, b: undefined })).toStrictEqual({ a: 1 })
})

test('keeps null properties', () => {
	expect<unknown>(removeUndefined({ a: null })).toStrictEqual({ a: null })
})

test('removes undefined properties of nested objects', () => {
	expect<unknown>(removeUndefined({ a: { b: undefined, c: 1 } })).toStrictEqual({ a: { c: 1 } })
})

test('removes undefined items of arrays', () => {
	expect<unknown>(removeUndefined({ a: [{ b: undefined }, undefined] })).toStrictEqual({ a: [{}] })
})
