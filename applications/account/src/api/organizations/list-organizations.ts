import type { Organization } from '@domain/account'
import { parseAndValidateQueryParameters } from '@package/drizzle'
import { endpoint } from '@package/fastify-plugins'
import { Schema } from '@package/json-schema'
import { type Page, Sort } from '@package/query-params'
import type { FastifySchema } from 'fastify'
import { organizationRepository } from '#/database/repositories/organization'
import { OrganizationSchema } from '#/schemas/organization'
import { QueryParametersSchema } from '#/schemas/query-parameters'
import { organizationParameters } from '#database/schemas/organizations'

const ListOrganizationRequestSchema = {
	querystring: QueryParametersSchema,
	response: {
		200: Schema.Page(OrganizationSchema)
	}
} satisfies FastifySchema

export const listOrganizations = endpoint(
	ListOrganizationRequestSchema,
	async (request): Promise<Page<Organization>> => {
		const parameters = parseAndValidateQueryParameters(request.query, {
			defaultSort: Sort.asc('id'),
			defaultPaginationSize: 10,
			columnMapping: organizationParameters
		})
		return await organizationRepository.getPage(parameters)
	}
)
