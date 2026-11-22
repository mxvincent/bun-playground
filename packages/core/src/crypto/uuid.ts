import { randomUUID } from 'node:crypto'
import { v7 } from 'uuid'

export const generateUUID = (version: 7 | 4 = 7) => {
	if (version === 7) {
		return v7()
	}
	return randomUUID()
}
