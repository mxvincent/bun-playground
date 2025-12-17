import fs from 'node:fs'
import { resolve } from 'node:path'
import type { JsonArray, JsonObject } from '../json/types'
import { isReadableFileSync } from './is-readable-file'

/**
 * Get file content as string synchronously
 */
export const readJsonFileSync = <T = JsonObject | JsonArray>(path: string): T => {
	const fullPath = resolve(path)
	if (!isReadableFileSync(fullPath)) {
		throw new Error(`File does not exists or is not readable (path=${fullPath})`)
	}
	const fileContent = fs.readFileSync(fullPath).toString('utf-8')
	return JSON.parse(fileContent)
}
