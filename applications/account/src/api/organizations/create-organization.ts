import type { Organization } from '@domain/account'
import { Type } from '@fastify/type-provider-typebox'
import { endpoint } from '@package/fastify-plugins'
import type { FastifySchema } from 'fastify'
import { organizationRepository } from '#/database/repositories/organization'
import { OrganizationSchema } from '#/schemas/organization'

const CreateOrganizationSchema = Type.Object({
	name: Type.String()
})

const CreateOrganizationRequestSchema = {
	body: CreateOrganizationSchema,
	response: {
		201: OrganizationSchema
	}
} satisfies FastifySchema

export const createOrganization = endpoint(CreateOrganizationRequestSchema, async (request): Promise<Organization> => {
	return await organizationRepository.create(request.body)
})
