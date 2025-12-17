/**
 * Converts a base64 encoded string to a UTF-8 string
 * Similar to `atob()` but compatible with UTF-8 strings
 * @link https://developer.mozilla.org/en-US/docs/Web/API/atob
 */
export const base64Decode = (data: string) => {
	return Buffer.from(data, 'base64').toString('utf-8')
}

/**
 * Converts a UTF-8 string to a base64 encoded string
 * Similar to `btoa()` but compatible with UTF-8 strings
 * @link https://developer.mozilla.org/en-US/docs/Web/API/btoa
 */
export const base64Encode = (str: string) => {
	return Buffer.from(str, 'utf-8').toString('base64')
}
