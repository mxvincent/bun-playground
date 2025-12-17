import type { Filter } from '../filter/filters'
import { Pagination } from '../pagination/pagination'
import type { Sort } from '../sort/sort'

export class FindQueryParameters<T extends string> {
	sorts: Sort<T>[]
	filters: Filter<T>[]

	constructor(options?: Partial<FindQueryParameters<T>>) {
		this.sorts = options?.sorts ?? []
		this.filters = options?.filters ?? []
	}
}

export class PageQueryParameters<T extends string> extends FindQueryParameters<T> {
	pagination: Pagination

	constructor(options?: Partial<PageQueryParameters<T>>) {
		super(options)
		this.pagination = options?.pagination ?? Pagination.take(Pagination.DEFAULT_PAGE_SIZE)
	}
}
