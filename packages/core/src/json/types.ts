export type JsonLike<T> = T | { [x: string]: JsonLike<T> } | Array<JsonLike<T>>
export type JsonValue = JsonLike<string | number | boolean | null>
export type JsonObject = { [key: string]: JsonValue }
export type JsonArray = JsonValue[]

/**
 * Derive a JSON type from a js type
 */
export type DeriveJsonType<T> = {
	[K in keyof T]?: T[K] extends object ? DeriveJsonType<T[K]> : T[K] extends number | boolean ? T[K] : string
}
