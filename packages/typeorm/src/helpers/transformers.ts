import { isDate, isNumber } from '@package/core'
import type { ValueTransformer } from 'typeorm'

const date: ValueTransformer = {
	/**
	 * Used to marshal data when writing to the database.
	 */
	to: (value?: Date | null): string | null | undefined => (isDate(value) ? value.toISOString() : value),
	/**
	 * Used to unmarshal data when reading from the database.
	 */
	from: (value: string | null): Date | null => (value ? new Date(value) : null)
}

const decimal: ValueTransformer = {
	/**
	 * Used to marshal data when writing to the database.
	 */
	to: (value?: number | null): string | null | undefined => (isNumber(value) ? value.toString(10) : value),
	/**
	 * Used to unmarshal data when reading from the database.
	 */
	from: (value: string | null): number | null => (value ? parseFloat(value) : null)
}

export const transformers = { date, decimal }
