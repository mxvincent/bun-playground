/**
 * Parse json from message content buffer
 */
export const bufferToJson = (data: Buffer): Record<string, unknown> => {
	return JSON.parse(data.toString())
}

/**
 * Create buffer from json
 * @param data
 */
export const jsonToBuffer = (data: Record<string, unknown>): Buffer => {
	return Buffer.from(JSON.stringify(data))
}
