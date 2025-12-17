export class Pagination {
	static DEFAULT_PAGE_SIZE = 10
	readonly size: number
	readonly cursor?: string
	isCountRequested = true

	private constructor(pageSize: number, cursor?: string) {
		this.size = pageSize
		this.cursor = cursor
	}

	static take(pageSize: number, cursor?: string) {
		return new Pagination(pageSize, cursor)
	}
}
