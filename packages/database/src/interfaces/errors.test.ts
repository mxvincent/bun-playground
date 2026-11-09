import { expect, it } from 'bun:test'
import { ComparisonFilter } from '@package/query-params'
import { EntityNotFoundError } from './errors'

it('toJSON() adds the serialized filters', () => {
	expect(new EntityNotFoundError('author', [ComparisonFilter.equal('id', '1')]).toJSON()).toStrictEqual({
		statusCode: 404,
		message: 'Entity not found',
		code: 'ENTITY_NOT_FOUND',
		filters: [{ type: 'comparison', operator: 'equal', path: 'id', value: '1' }]
	})
})
