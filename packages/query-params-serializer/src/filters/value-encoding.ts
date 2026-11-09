const BASE64URL = /^[A-Za-z0-9_-]*$/
const utf8Decoder = new TextDecoder('utf-8', { fatal: true })

/**
 * Encode a filter value as base64url (RFC 4648 §5, without padding).
 * Its alphabet holds neither the separators of the filter format (`(`, `)`, `,`) nor characters that have a
 * meaning in a URL, so a value is encoded once, whatever it contains.
 */
export const encodeFilterValue = (value: string): string => {
	return Buffer.from(value, 'utf-8').toString('base64url')
}

/**
 * Decode a base64url filter value
 * @throws {TypeError} when the value is not canonical base64url or does not hold UTF-8 text
 */
export const decodeFilterValue = (encoded: string): string => {
	const bytes = Buffer.from(encoded, 'base64url')
	// Buffer ignores invalid characters: re-encoding rejects anything that is not the canonical form
	if (!BASE64URL.test(encoded) || bytes.toString('base64url') !== encoded) {
		throw new TypeError(`Filter value is not base64url: ${encoded}`)
	}
	return utf8Decoder.decode(bytes)
}

export type FilterValueEncoding = {
	/** Encode a filter value: the result must hold none of `(`, `)` and `,` */
	encode: (value: string) => string
	/** Decode a filter value; throw when the value cannot be decoded */
	decode: (encoded: string) => string
}

export const BASE64URL_FILTER_VALUE_ENCODING: FilterValueEncoding = Object.freeze({
	encode: encodeFilterValue,
	decode: decodeFilterValue
})

let filterValueEncoding: FilterValueEncoding = BASE64URL_FILTER_VALUE_ENCODING

/**
 * Configure, once for the whole process, how filter values are encoded by the serialize functions and decoded
 * by the parse functions. Both sides of a query string must use the same encoding. Defaults to base64url.
 */
export const configureFilterValueEncoding = (encoding: FilterValueEncoding): void => {
	filterValueEncoding = encoding
}

/**
 * Restore the default base64url encoding
 */
export const resetFilterValueEncoding = (): void => {
	filterValueEncoding = BASE64URL_FILTER_VALUE_ENCODING
}

/**
 * Get the configured filter value encoding
 */
export const getFilterValueEncoding = (): FilterValueEncoding => filterValueEncoding
