export class Pagination {
	static DEFAULT_PAGE_SIZE = 10
	static MAX_PAGE_SIZE = 100
	readonly size: number
	readonly cursor?: string
	isCountRequested = true

	private constructor(pageSize: number, cursor?: string) {
		const size = Number.isNaN(pageSize) ? Pagination.DEFAULT_PAGE_SIZE : Math.floor(pageSize)
		this.size = Math.max(1, Math.min(size, Pagination.MAX_PAGE_SIZE))
		this.cursor = cursor
	}

	/**
	 * Request a page of `pageSize` items, clamped between 1 and MAX_PAGE_SIZE.
	 * A page size that is not a number (NaN) falls back to DEFAULT_PAGE_SIZE.
	 */
	static take(pageSize: number, cursor?: string) {
		return new Pagination(pageSize, cursor)
	}
}
