import { describe, expect, it } from 'bun:test'
import { QueryUtils } from './generateParameterName'

describe('QueryUtils.generateParameterName()', () => {
	it('should return 8 base62 chars', async () => {
		expect(QueryUtils.generateParameterName()).toMatch(/[a-zA-Z0-9]{8}/)
	})

	it('should return 12 base62 chars', async () => {
		expect(QueryUtils.generateParameterName(12)).toMatch(/[a-zA-Z0-9]{12}/)
	})
})
