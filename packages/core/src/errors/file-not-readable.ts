import { BaseError } from '@package/errors'

/**
 * A file does not exist or the process cannot read it
 */
export class FileNotReadableError extends BaseError {
	code = 'FILE_NOT_READABLE'
	readonly path: string

	constructor(path: string) {
		super(`File does not exists or is not readable (path=${path})`)
		this.path = path
	}

	override toJSON() {
		return { ...super.toJSON(), path: this.path }
	}
}
