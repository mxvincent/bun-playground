import { base64Decode, base64Encode, invariant, type KeyOf, type ObjectLiteral } from '@package/core'
import { isNil } from 'es-toolkit'

export const CURSOR_SEPARATOR = ','

/**
 * Serialize cursor part
 */
export const serializeCursorValue = (value: unknown): string => {
	if (isNil(value)) {
		return '\0'
	}
	switch (typeof value) {
		case 'string':
			return value
		case 'number':
		case 'bigint':
			return String(value)
		case 'object':
			if (value instanceof Date) {
				return value.toISOString()
			}
			break
	}
	throw new TypeError(`unserializable value given as cursor part: ${value}`)
}

/**
 * Parse cursor part from string
 * @param value
 */
export const parseCursorValue = (value: string): string | null => {
	return value === '\0' ? null : value
}

export type StringTransformer = (val: string) => string

export class PaginationCursorTransformer<T extends ObjectLiteral> {
	decoder: StringTransformer
	encoder: StringTransformer
	keys: KeyOf<T>[] = []

	constructor(keys: KeyOf<T>[], options?: { decoder?: StringTransformer; encoder?: StringTransformer }) {
		this.keys = keys.toSorted()
		this.decoder = options?.decoder ?? base64Decode
		this.encoder = options?.encoder ?? base64Encode
	}

	/**
	 * Decode cursor and return values as record
	 */
	decode(cursor: string): Record<KeyOf<T>, string> {
		const parameters = this.decoder(cursor).split(CURSOR_SEPARATOR)
		return this.keys.reduce(
			(decoded, key, index) => {
				return Object.assign(decoded, {
					[key]: parseCursorValue(invariant(parameters[index]))
				})
			},
			{} as Record<KeyOf<T>, string>
		)
	}

	/**
	 * Create a cursor from sort options
	 */
	encode(entity: T): string {
		const cursor = this.keys
			.map((key) => entity[key])
			.map(serializeCursorValue)
			.join(CURSOR_SEPARATOR)
		return this.encoder(cursor)
	}
}
