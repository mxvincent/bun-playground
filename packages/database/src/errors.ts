import { BaseError } from '@package/errors'

export type SliceOption = 'collection' | 'take'

/**
 * `slice()` is given an empty collection or a `take` below 1
 */
export class InvalidSliceOptionError extends BaseError {
	code = 'INVALID_SLICE_OPTION'
	readonly option: SliceOption

	constructor(option: SliceOption, message: string) {
		super(message)
		this.option = option
	}

	override toJSON() {
		return { ...super.toJSON(), option: this.option }
	}
}
