import { BaseError } from '@package/errors'

/**
 * No `package.json` is found in the directory of a path or any of its parents
 */
export class PackageRootNotFoundError extends BaseError {
	code = 'PACKAGE_ROOT_NOT_FOUND'
	readonly startingPath: string

	constructor(startingPath: string) {
		super('Failed to find package root directory.')
		this.startingPath = startingPath
	}

	override toJSON() {
		return { ...super.toJSON(), startingPath: this.startingPath }
	}
}
