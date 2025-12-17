import { describe, expect, it } from 'bun:test'
import { xor } from './xor'

describe('xor', () => {
	it('should return true when first argument is true and second is false', () => {
		expect(xor(true, false)).toBe(true)
	})

	it('should return true when first argument is false and second is true', () => {
		expect(xor(false, true)).toBe(true)
	})

	it('should return false when first argument is true and second is true', () => {
		expect(xor(true, true)).toBe(false)
	})

	it('should return false when first argument is false and second is false', () => {
		expect(xor(false, false)).toBe(false)
	})
})
