import { existsSync } from 'node:fs'
import { dirname } from 'node:path'
import { memoize } from 'es-toolkit'

export const recursiveDirname = (iteration: number, path: string): string => {
	if (iteration === 0) {
		return path
	}
	return recursiveDirname(iteration - 1, dirname(path))
}

export const withProtocol = (protocol: 'http' | 'https') => (url: string) => `${protocol}://${url}`

export const http = withProtocol('http')
export const https = withProtocol('https')

/**
 * Get applications directory path
 */
export const getRepositoryRootDirectory = memoize((path: string): string => {
	if (path === '/') {
		throw new Error('Failed to find repository root dir')
	}
	if (existsSync(`${path}/bun.lock`)) {
		return path
	}
	return getRepositoryRootDirectory(dirname(path))
})

/**
 * Find or create value in a map
 */
export const findOrCreate = <K, V>(values: Map<K, V>, key: K, createValue: () => V): V => {
	let value = values.get(key)
	if (!value) {
		value = createValue()
		values.set(key, value)
	}
	return value
}
