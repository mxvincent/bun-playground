import { expect, it } from 'bun:test'
import { decodeFilterValue, encodeFilterValue } from './value-encoding'

it('encodes a value with the base64url alphabet only', () => {
	expect(encodeFilterValue('a,b (c)/d+e?=é')).toMatch(/^[A-Za-z0-9_-]+$/)
})

it.each(['', 'a', 'a,b (c)%2C', 'é 🙂'])('decodes back the encoded value %p', (value) => {
	expect(decodeFilterValue(encodeFilterValue(value))).toBe(value)
})

it.each([
	['a character outside the base64url alphabet', 'YQ==', 'Filter value is not base64url: YQ=='],
	['a non canonical encoding', 'YR', 'Filter value is not base64url: YR'],
	['an impossible length', 'Y', 'Filter value is not base64url: Y'],
	[
		'bytes that are not UTF-8',
		Buffer.from([0xff]).toString('base64url'),
		'The encoded data was not valid for encoding utf-8'
	]
])('rejects %s', (_case, encoded, message) => {
	expect(() => decodeFilterValue(encoded)).toThrow(expect.objectContaining({ constructor: TypeError, message }))
})
