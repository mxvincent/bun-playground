import fs from 'node:fs'

/**
 * Check if file is usable synchronously
 */
export const isReadableFileSync = (path: string) => {
	try {
		fs.accessSync(path, fs.constants.R_OK)
		return true
	} catch {
		return false
	}
}
