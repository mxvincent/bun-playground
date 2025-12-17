import type { KeyOf } from '@package/core'
import { filterArrayWith, sortArrayWith } from '@package/database'
import { ResourceNotFoundError } from '@package/errors'
import {
	type ComparisonFilter,
	createEmptyPage,
	type Page,
	type PageQueryParameters,
	PaginationCursorTransformer
} from '@package/query-params'
import { factories } from '../index'
import type { CreateOrganization, OrganizationRepository, UpdateOrganization } from '../repositories/organization'
import type { Organization } from '../schemas/organization'

const collection = new Map<string, Organization>()

export class FakeOrganisationRepository implements OrganizationRepository {
	getPage({ filters, sorts }: PageQueryParameters<KeyOf<Organization>>): Promise<Page<Organization>> {
		const filtered = filterArrayWith([...collection.values()], filters)
		const cursorTransformer = new PaginationCursorTransformer(sorts.map((sort) => sort.path))
		const sorted = sortArrayWith(filtered, sorts)
		const page = createEmptyPage<Organization>()
		page.edges = sorted.map((node) => ({
			node,
			cursor: cursorTransformer.encode(node)
		}))
		return Promise.resolve(page)
	}

	findMany({
		filters,
		sorts
	}: Pick<PageQueryParameters<KeyOf<Organization>>, 'filters' | 'sorts'>): Promise<Organization[]> {
		const filtered = filterArrayWith([...collection.values()], filters)
		const sorted = sortArrayWith(filtered, sorts)
		return Promise.resolve(sorted)
	}

	create(values: CreateOrganization): Promise<Organization> {
		const record = factories.organization(values)
		collection.set(record.id, record)
		return Promise.resolve(record)
	}

	update(record: Organization, values: UpdateOrganization): Promise<Organization> {
		const organization = collection.get(record.id)
		if (!organization) {
			throw new ResourceNotFoundError('organization', record.id)
		}
		Object.assign(organization, values)
		return Promise.resolve(organization)
	}

	delete(record: Organization): Promise<Organization> {
		const organization = collection.get(record.id)
		if (!organization) {
			throw new ResourceNotFoundError('organization', record.id)
		}
		collection.delete(record.id)
		return Promise.resolve(organization)
	}

	findOne(filters: ComparisonFilter<keyof Organization>[]): Promise<Organization | null> {
		const items = filterArrayWith([...collection.values()], filters)
		return Promise.resolve(items.at(0) ?? null)
	}

	async findOneOrFail(filters: ComparisonFilter<keyof Organization>[]): Promise<Organization> {
		const item = await this.findOne(filters)

		if (!item) {
			throw new ResourceNotFoundError('organization', filters)
		}
		return item
	}

	getById(organizationId: string): Promise<Organization | null> {
		return Promise.resolve(collection.get(organizationId) ?? null)
	}
}
