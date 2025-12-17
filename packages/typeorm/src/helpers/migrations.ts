import type { Optional } from '@package/core'
import type { DataSource, Migration, TableColumnOptions } from 'typeorm'
import { defaults } from './defaults'

export const timestampColumn = (
	options: Pick<TableColumnOptions, 'name'> & Optional<Pick<TableColumnOptions, 'isNullable' | 'default'>>
): TableColumnOptions => {
	return {
		type: 'timestamp with time zone',
		precision: 3,
		name: options.name,
		isNullable: options.isNullable ?? false,
		default: options.default
	}
}

/**
 * Create table columns definition array for a resource
 */
export const withResourceColumns = (columns: TableColumnOptions[]): TableColumnOptions[] => {
	return [
		{ name: 'id', type: 'uuid', isPrimary: true, default: defaults.uuid },
		timestampColumn({ name: 'createdAt', default: defaults.date }),
		timestampColumn({ name: 'updatedAt', default: defaults.date })
	]
		.filter((resourceCol) => !columns.some((argCol) => argCol.name === resourceCol.name))
		.concat(columns)
}

/**
 * Create table columns definition array for a resource with soft delete support
 */
export const withDeletableResourceColumns = (columns: TableColumnOptions[]): TableColumnOptions[] => {
	return withResourceColumns([...columns, timestampColumn({ name: 'deletedAt', isNullable: true })])
}

/**
 * Run migrations for given DataSource
 */
export const runMigrations = async (dataSource: DataSource): Promise<Migration[]> => {
	return await dataSource.runMigrations({ transaction: 'each' })
}
