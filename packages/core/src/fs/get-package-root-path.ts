import { dirname } from 'node:path'
import { isReadableFileSync } from './is-readable-file'

export const getPackageRootPath = (path: string, startingPath = path): string => {
	const directory = dirname(path)
	if (directory === '/') {
		throw new Error('Failed to find package root directory.')
	}
	if (isReadableFileSync(`${directory}/package.json`)) {
		return directory
	} else {
		return getPackageRootPath(directory, startingPath)
	}
}
