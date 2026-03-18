import { base64Decode, base64Encode, type KeyOf, type ObjectLiteral } from '@package/core'
import { isNil } from 'es-toolkit'

type CursorValue = string | number | null

export type StringTransformer = (val: string) => string

/**
 * Serialize a single entity value for JSON cursor storage
 */
const toCursorValue = (value: unknown): CursorValue => {
	if (isNil(value)) {
		return null
	}
	switch (typeof value) {
		case 'string':
			return value
		case 'number':
		case 'bigint':
			return Number(value)
		case 'object':
			if (value instanceof Date) {
				return value.toISOString()
			}
			break
	}
	throw new TypeError(`unserializable value given as cursor part: ${value}`)
}

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
	decode(cursor: string): Record<KeyOf<T>, string | null> {
		const json = JSON.parse(this.decoder(cursor)) as Record<string, CursorValue>
		return this.keys.reduce(
			(decoded, key) => {
				const value = json[key]
				return Object.assign(decoded, {
					[key]: isNil(value) ? null : String(value)
				})
			},
			{} as Record<KeyOf<T>, string | null>
		)
	}

	/**
	 * Create a cursor from sort keys
	 */
	encode(entity: T): string {
		const json: Record<string, CursorValue> = {}
		for (const key of this.keys) {
			json[key] = toCursorValue(entity[key])
		}
		return this.encoder(JSON.stringify(json))
	}
}