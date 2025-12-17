import type { Organization } from '@domain/account'
import { endpoint } from '@package/fastify-plugins'
import { NotFoundResponseSchema, Schema } from '@package/json-schema'
import { ComparisonFilter } from '@package/query-params'
import type { FastifySchema } from 'fastify'
import { organizationRepository } from '#/database/repositories/organization'
import { OrganizationSchema } from '#/schemas/organization'

export const GetOrganizationParamsSchema = Schema.Object({
	organizationId: Schema.String({ format: 'uuid' })
})

const GetOrganizationRequestSchema = {
	params: GetOrganizationParamsSchema,
	response: {
		200: OrganizationSchema,
		404: NotFoundResponseSchema
	}
} satisfies FastifySchema

export const getOrganization = endpoint(GetOrganizationRequestSchema, async (request): Promise<Organization> => {
	return await organizationRepository.findOneOrFail([ComparisonFilter.equal('id', request.params.organizationId)])
})
