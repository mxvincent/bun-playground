import { describe, expect, it } from 'bun:test'
import { Pagination } from './pagination'

describe('Pagination', () => {
	it('should use the given page size', () => {
		expect(Pagination.take(20).size).toBe(20)
	})

	it('should clamp page size to MAX_PAGE_SIZE', () => {
		expect(Pagination.take(500).size).toBe(Pagination.MAX_PAGE_SIZE)
	})

	it('should clamp page size to a minimum of 1', () => {
		expect(Pagination.take(0).size).toBe(1)
		expect(Pagination.take(-5).size).toBe(1)
	})
})