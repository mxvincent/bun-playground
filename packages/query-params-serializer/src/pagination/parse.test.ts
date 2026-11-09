import { expect, it } from 'bun:test'
import { Pagination } from '@package/query-params'
import { parsePagination } from './parse'

it('uses the take and after parameters', () => {
	expect(parsePagination({ take: '2', after: 'cursor' })).toStrictEqual(Pagination.take(2, 'cursor'))
})

it('uses the given default page size without take parameter', () => {
	expect(parsePagination({}, { defaultPageSize: 20 })).toStrictEqual(Pagination.take(20))
})

it('uses DEFAULT_PAGE_SIZE without take parameter nor default page size', () => {
	expect(parsePagination({})).toStrictEqual(Pagination.take(Pagination.DEFAULT_PAGE_SIZE))
})

it('uses the first value of a repeated parameter', () => {
	expect(parsePagination({ take: ['10', '50'], after: ['abc', 'def'] })).toStrictEqual(Pagination.take(10, 'abc'))
})

it('ignores an empty cursor', () => {
	expect(parsePagination({ after: '' }, { defaultPageSize: 10 })).toStrictEqual(Pagination.take(10))
})
