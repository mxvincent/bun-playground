import type { Organization } from '@domain/account'
import { ResourceNotFoundError } from '@package/errors'
import { endpoint } from '@package/fastify-plugins'
import { NotFoundResponseSchema, Schema } from '@package/json-schema'
import { ComparisonFilter } from '@package/query-params'
import type { FastifySchema } from 'fastify'
import { organizationRepository } from '#/database/repositories/organization'
import { OrganizationSchema } from '#/schemas/organization'
import { GetOrganizationParamsSchema } from '#api/organizations/get-organization'

const UpdateOrganizationSchema = Schema.Object({
	name: Schema.String()
})

const schema = {
	params: GetOrganizationParamsSchema,
	body: UpdateOrganizationSchema,
	response: {
		200: OrganizationSchema,
		404: NotFoundResponseSchema
	}
} satisfies FastifySchema

export const updateOrganization = endpoint(schema, async (request): Promise<Organization> => {
	const organization = await organizationRepository.findOne([
		ComparisonFilter.equal('id', request.params.organizationId)
	])
	if (!organization) {
		throw new ResourceNotFoundError('Organization', request.params.organizationId)
	}
	await organizationRepository.update(organization, request.body as never)
	return organization
})
