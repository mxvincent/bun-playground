/**
 * Transform buffer to json
 */
export const bufferToJson = (data: Buffer): Record<string, unknown> => {
	return JSON.parse(data.toString('utf-8'))
}
