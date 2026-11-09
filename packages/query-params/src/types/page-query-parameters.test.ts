import { expect, it } from 'bun:test'
import { Pagination } from '../pagination/pagination'
import { PageQueryParameters } from './page-query-parameters'

it('defaults to no sort, no filter and a page of DEFAULT_PAGE_SIZE', () => {
	expect(new PageQueryParameters()).toMatchObject({
		sorts: [],
		filters: [],
		pagination: { size: Pagination.DEFAULT_PAGE_SIZE }
	})
})
