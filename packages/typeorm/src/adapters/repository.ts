import type { KeyOf, ObjectLiteral } from '@package/core'
import type { Page, PageQueryParameters } from '@package/query-params'
import type { DeepPartial, FindManyOptions, FindOptionsWhere, ObjectType } from 'typeorm'
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js'
import { TypeormResourceNotFoundError } from '../errors/resource-not-found'
import { getPrimaryKeyColumns } from '../helpers/primary-key'
import { Pager } from '../pagination'
import type { FindResourceOptions } from '../types/FindResourceOptions'
import type { TypeormDatabaseContext } from './context'

export class TypeormRepository<T extends ObjectLiteral> {
	readonly context: TypeormDatabaseContext
	readonly entity: ObjectType<T>

	constructor(context: TypeormDatabaseContext, entity: ObjectType<T>) {
		this.context = context
		this.entity = entity
	}

	getPrimaryKey(record: T): Partial<T> {
		return getPrimaryKeyColumns(this.entity).reduce((primaryKey, column) => {
			return Object.assign(primaryKey, { [column]: record[column] })
		}, {})
	}

	async getPage({ filters, sorts, pagination }: PageQueryParameters<KeyOf<T>>): Promise<Page<T>> {
		const query = this.context.manager.createQueryBuilder(this.entity, 'root')
		const pager = new Pager(this.entity, { query, filters, sorts })
		return await pager.getPage(pagination)
	}

	async findMany(where: FindOptionsWhere<T>, options?: Omit<FindManyOptions<T>, 'where'>): Promise<T[]> {
		return await this.context.manager.find(this.entity, { where, ...options })
	}

	async findOne(where: FindOptionsWhere<T>, options?: FindResourceOptions<T>): Promise<T | null> {
		return await this.context.manager.findOne(this.entity, {
			where,
			...options
		})
	}

	async findOneOrFail(where: FindOptionsWhere<T>, options?: FindResourceOptions<T>): Promise<T> {
		const resource = await this.findOne(where, options)
		if (resource) {
			return resource
		}
		throw TypeormResourceNotFoundError.fromWhereOptions(this.context.dataSource, this.entity, where)
	}

	async create(payload: Partial<T>): Promise<T> {
		const repository = this.context.manager.getRepository(this.entity)
		const record = repository.create(payload as DeepPartial<T>)
		await repository.insert(record)
		return record
	}

	async update(record: T, changes: QueryDeepPartialEntity<T>): Promise<T> {
		const where = this.getPrimaryKey(record)
		const { affected } = await this.context.manager.update(this.entity, where, changes)
		if (!affected) {
			throw TypeormResourceNotFoundError.fromWhereOptions(this.context.dataSource, this.entity, where)
		}
		Object.assign(record, changes)
		return record
	}

	async delete(record: T): Promise<T> {
		const where = this.getPrimaryKey(record)
		const { affected } = await this.context.manager.delete(this.entity, where)
		if (!affected) {
			throw TypeormResourceNotFoundError.fromWhereOptions(this.context.manager.connection, this.entity, where)
		}
		return record
	}
}
