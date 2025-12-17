import { beforeEach, describe, expect, it } from 'bun:test'
import { Author } from '#test-helpers/entities'
import { getPrimaryKeyColumns, primaryKeys, setPrimaryKeyColumns } from './primary-key'

beforeEach(() => {
	primaryKeys.delete(Author)
})

describe('set sortable paths', () => {
	it('should set map entry', () => {
		setPrimaryKeyColumns(Author, ['id'])
		expect(primaryKeys.get(Author)).toEqual(['id'])
	})
})

describe('get primary key', () => {
	it('should return primary key', () => {
		primaryKeys.set(Author, ['id'])
		expect(getPrimaryKeyColumns(Author)).toEqual(['id'])
	})
	it('should throw an error if key is not configured', () => {
		expect(() => getPrimaryKeyColumns(Author)).toThrowError(`Primary key is not configured for Author`)
	})
})
