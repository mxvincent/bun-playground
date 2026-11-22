import { dirname } from 'node:path'
import { PackageRootNotFoundError } from '../errors/package-root-not-found'
import { isReadableFileSync } from './is-readable-file'

export const getPackageRootPath = (path: string, startingPath = path): string => {
	const directory = dirname(path)
	if (directory === '/') {
		throw new PackageRootNotFoundError(startingPath)
	}
	if (isReadableFileSync(`${directory}/package.json`)) {
		return directory
	} else {
		return getPackageRootPath(directory, startingPath)
	}
}
