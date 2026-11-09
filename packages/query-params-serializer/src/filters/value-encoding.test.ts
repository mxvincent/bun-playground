import { expect, it } from 'bun:test'
import { decodeFilterValue, encodeFilterValue } from './value-encoding'

it('encodes a value with the base64url alphabet only', () => {
	expect(encodeFilterValue('a,b (c)/d+e?=é')).toMatch(/^[A-Za-z0-9_-]+$/)
})

it.each(['', 'a', 'a,b (c)%2C', 'é 🙂'])('decodes back the encoded value %p', (value) => {
	expect(decodeFilterValue(encodeFilterValue(value))).toBe(value)
})

it.each([
	['a character outside the base64url alphabet', 'YQ=='],
	['a non canonical encoding', 'YR'],
	['an impossible length', 'Y'],
	['bytes that are not UTF-8', Buffer.from([0xff]).toString('base64url')]
])('rejects %s', (_case, encoded) => {
	expect(() => decodeFilterValue(encoded)).toThrow(TypeError)
})
