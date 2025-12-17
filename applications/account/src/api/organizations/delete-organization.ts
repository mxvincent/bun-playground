import { endpoint } from '@package/fastify-plugins'
import { NoContentResponseSchema, NotFoundResponseSchema } from '@package/json-schema'
import { ComparisonFilter } from '@package/query-params'
import type { FastifySchema } from 'fastify'
import { organizationRepository } from '#/database/repositories/organization'
import { GetOrganizationParamsSchema } from '#api/organizations/get-organization'

const DeleteOrganizationRequestSchema = {
	params: GetOrganizationParamsSchema,
	response: {
		204: NoContentResponseSchema,
		404: NotFoundResponseSchema
	}
} satisfies FastifySchema

export const deleteOrganization = endpoint(DeleteOrganizationRequestSchema, async (request, reply): Promise<void> => {
	const organization = await organizationRepository.findOneOrFail([
		ComparisonFilter.equal('id', request.params.organizationId)
	])
	await organizationRepository.delete(organization)
	reply.status(204)
})
