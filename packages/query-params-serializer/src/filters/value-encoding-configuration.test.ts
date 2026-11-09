import { afterEach, expect, it } from 'bun:test'
import { ComparisonFilter } from '@package/query-params'
import { QueryStringParameterValidationError } from '../shared/errors'
import { parseFilters } from './parse'
import { serializeFilters } from './serialize'
import {
	BASE64URL_FILTER_VALUE_ENCODING,
	configureFilterValueEncoding,
	getFilterValueEncoding,
	resetFilterValueEncoding
} from './value-encoding'

// A readable encoding that escapes the separators of the format
const hexEncoding = {
	encode: (value: string) => Buffer.from(value).toString('hex'),
	decode: (encoded: string) => {
		if (!/^([0-9a-f]{2})*$/.test(encoded)) {
			throw new TypeError('not hex')
		}
		return Buffer.from(encoded, 'hex').toString()
	}
}

afterEach(() => {
	resetFilterValueEncoding()
})

it('uses base64url by default', () => {
	expect(getFilterValueEncoding()).toBe(BASE64URL_FILTER_VALUE_ENCODING)
})

it('serializes the values with the configured encoding', () => {
	configureFilterValueEncoding(hexEncoding)
	expect(serializeFilters([ComparisonFilter.in('a', ['x', 'y'])])).toStrictEqual(['in(a,78,79)'])
})

it('parses the values with the configured encoding', () => {
	configureFilterValueEncoding(hexEncoding)
	expect(parseFilters('equal(a,78)')).toStrictEqual([ComparisonFilter.equal('a', 'x')])
})

it('turns a failure of the configured decoder into a validation error', () => {
	configureFilterValueEncoding(hexEncoding)
	expect(() => parseFilters('equal(a,zz)')).toThrow(QueryStringParameterValidationError)
})

it('restores base64url', () => {
	configureFilterValueEncoding(hexEncoding)
	resetFilterValueEncoding()
	expect(getFilterValueEncoding()).toBe(BASE64URL_FILTER_VALUE_ENCODING)
})
