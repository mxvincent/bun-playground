import {
	type CreateOrganization,
	factories,
	type Organization,
	type OrganizationRepository,
	type UpdateOrganization
} from '@domain/account'
import type { KeyOf } from '@package/core'
import { EntityNotFoundError } from '@package/database'
import { DrizzleCursorPager, transformFilters } from '@package/drizzle'
import type { ComparisonFilter, Page, PageQueryParameters } from '@package/query-params'
import { logger } from '@package/telemetry'
import { and } from 'drizzle-orm'
import * as SQLCondition from 'drizzle-orm/sql/expressions/conditions'
import { database } from '#database/client'
import { organization, organizationParameters } from '#database/schemas/organizations'
import { tables } from '#database/tables'

type OrganizationParameters = KeyOf<typeof organizationParameters>

export class OrganizationPostgresRepository implements OrganizationRepository {
	pager = new DrizzleCursorPager({
		database,
		table: organization,
		columnMapping: organizationParameters,
		primaryKey: {
			id: tables.organization.id
		}
	})

	async findOne(filters: ComparisonFilter<OrganizationParameters>[]): Promise<Organization | null> {
		const where = and(...transformFilters(filters, organizationParameters))
		const [result] = await database.select().from(organization).where(where).execute()
		return result ?? null
	}

	async findOneOrFail(filters: ComparisonFilter<OrganizationParameters>[]): Promise<Organization> {
		const organization = await this.findOne(filters)
		if (!organization) {
			throw new EntityNotFoundError('Organization', filters)
		}
		return organization
	}

	async create(values: CreateOrganization): Promise<Organization> {
		const organization = factories.organization(values)
		const result = await database.insert(tables.organization).values(organization)
		if (result.rowCount !== 1) {
			throw new Error('Organization not created')
		}
		return organization
	}

	async update(organization: Organization, values: UpdateOrganization): Promise<Organization> {
		const changes = { ...values, updatedAt: new Date() }
		const result = await database
			.update(tables.organization)
			.set(changes)
			.where(SQLCondition.eq(tables.organization.id, organization.id))
		if (result.rowCount !== 1) {
			throw new Error('Organization not updated')
		}
		return Object.assign(organization, changes)
	}

	async delete(entity: Organization): Promise<Organization> {
		const result = await database.delete(tables.organization).where(SQLCondition.eq(tables.organization.id, entity.id))
		if (result.rowCount !== 1) {
			throw new Error('Organization not deleted')
		} else {
			return entity
		}
	}

	async getPage(parameters: PageQueryParameters<OrganizationParameters>): Promise<Page<Organization>> {
		try {
			return await this.pager.getPage({
				query: database.select().from(organization).$dynamic(),
				parameters
			})
		} catch (error) {
			logger.error({ error }, 'Failed to get organizations page.')
			throw error
		}
	}
}

export const organizationRepository = new OrganizationPostgresRepository()
