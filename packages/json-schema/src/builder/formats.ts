import { type TString, Type } from '@sinclair/typebox'

/**
 * ISO 8601 date
 */
export const DateTime = (options?: { description: string }): TString => {
	return Type.String({
		format: 'iso-date-time',
		description: options?.description
	})
}

/**
 * UUID
 */
export const UUID = (options?: { description: string }): TString => {
	return Type.String({ format: 'uuid', description: options?.description })
}
