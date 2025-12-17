/**
 * Transform json to buffer
 */
export const jsonToBuffer = (data: Record<string, unknown>): Buffer => {
	return Buffer.from(JSON.stringify(data))
}
