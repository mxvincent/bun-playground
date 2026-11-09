import { expect, it } from 'bun:test'
import { Pagination } from './pagination'

it('uses the given page size', () => {
	expect(Pagination.take(20).size).toBe(20)
})

it('clamps the page size to MAX_PAGE_SIZE', () => {
	expect(Pagination.take(500).size).toBe(Pagination.MAX_PAGE_SIZE)
})

it.each([0, -5])('clamps the page size %p to 1', (size) => {
	expect(Pagination.take(size).size).toBe(1)
})
