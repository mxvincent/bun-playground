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
