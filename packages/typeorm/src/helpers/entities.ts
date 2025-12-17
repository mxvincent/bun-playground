import type { Optional } from '@package/core'
import {
	type ColumnOptions,
	CreateDateColumn,
	DeleteDateColumn,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm'
import { defaults } from './defaults'

/**
 * Generate options for datetime column
 */
export const timestampWithTimeZone = (
	options: Pick<ColumnOptions, 'name'> & Optional<Pick<ColumnOptions, 'nullable' | 'default'>> = {}
): ColumnOptions => {
	return {
		type: 'timestamp with time zone',
		name: options.name,
		nullable: options.nullable ?? false,
		default: options.nullable ? undefined : defaults.date
	}
}

/**
 * Abstract type for basic entities with createdAt and updatedAt timestamps
 */
export class Resource {
	/**
	 * UUID v4 used as primary key
	 */
	@PrimaryGeneratedColumn('uuid')
	id!: string

	/**
	 * Creation timestamp
	 */
	@CreateDateColumn(timestampWithTimeZone({ name: 'createdAt' }))
	createdAt!: Date

	/**
	 * Last update timestamp
	 */
	@UpdateDateColumn(timestampWithTimeZone({ name: 'updatedAt' }))
	updatedAt!: Date
}

/**
 * Abstract type for soft deletable resources
 */
export abstract class DeletableResource extends Resource {
	/**
	 * Soft delete timestamp
	 */
	@DeleteDateColumn(timestampWithTimeZone({ name: 'deletedAt', nullable: true }))
	deletedAt!: Date | null
}
