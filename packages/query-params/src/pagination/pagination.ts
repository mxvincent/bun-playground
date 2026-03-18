export class Pagination {
	static DEFAULT_PAGE_SIZE = 10
	static MAX_PAGE_SIZE = 100
	readonly size: number
	readonly cursor?: string
	isCountRequested = true

	private constructor(pageSize: number, cursor?: string) {
		this.size = Math.max(1, Math.min(pageSize, Pagination.MAX_PAGE_SIZE))
		this.cursor = cursor
	}

	static take(pageSize: number, cursor?: string) {
		return new Pagination(pageSize, cursor)
	}
}
