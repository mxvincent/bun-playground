import type { Resource } from '@package/database'
import { ResourceNotFoundError } from '@package/errors'
import type { ObjectType } from 'typeorm'
import type { PostgresDataSource } from '../types/postgres-data-source'

export class TypeormResourceNotFoundError extends ResourceNotFoundError {
	static format<T extends Resource>(
		entity: ObjectType<T>,
		record: T,
		dataSource: PostgresDataSource
	): TypeormResourceNotFoundError {
		const metadata = dataSource.getMetadata(entity)
		return new ResourceNotFoundError(metadata.name, metadata.getEntityIdMap(record) as never)
	}
}
