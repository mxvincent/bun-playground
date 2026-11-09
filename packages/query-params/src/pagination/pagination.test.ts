import { expect, it } from 'bun:test'
import { Pagination } from './pagination'

it('uses the given page size', () => {
	expect(Pagination.take(20).size).toBe(20)
})

it.each([500, Infinity])('clamps the page size %p to MAX_PAGE_SIZE', (size) => {
	expect(Pagination.take(size).size).toBe(Pagination.MAX_PAGE_SIZE)
})

it.each([0, -5])('clamps the page size %p to 1', (size) => {
	expect(Pagination.take(size).size).toBe(1)
})

it('falls back to DEFAULT_PAGE_SIZE for NaN', () => {
	expect(Pagination.take(NaN).size).toBe(Pagination.DEFAULT_PAGE_SIZE)
})

it('floors a decimal page size', () => {
	expect(Pagination.take(2.5).size).toBe(2)
})
