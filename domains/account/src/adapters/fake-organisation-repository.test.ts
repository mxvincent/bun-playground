import { describe, expect, test } from 'bun:test'
import { ResourceNotFoundError } from '@package/errors'
import { ComparisonFilter } from '@package/query-params'
import { FakeOrganisationRepository } from './fake-organisation-repository'

describe('FakeOrganisationRepository', () => {
	test('findOneOrFail() throws a ResourceNotFoundError that carries the filters of the lookup', async () => {
		const filters = [ComparisonFilter.equal('name', 'unknown')]
		const error = await new FakeOrganisationRepository().findOneOrFail(filters).catch((error: unknown) => error)

		expect(error).toBeInstanceOf(ResourceNotFoundError)
		expect((error as ResourceNotFoundError).toJSON()).toStrictEqual({
			statusCode: 404,
			message: 'Resource not found',
			code: 'RESOURCE_NOT_FOUND',
			resource: {
				type: 'organization',
				filters: [{ type: 'comparison', operator: 'equal', path: 'name', value: 'unknown' }]
			}
		})
	})
})
