import { Type } from '@package/json-schema'

export const QueryParametersSchema = Type.Object({
	size: Type.Optional(Type.Integer()),
	after: Type.Optional(Type.String()),
	before: Type.Optional(Type.String()),
	filters: Type.Optional(Type.Union([Type.String(), Type.Array(Type.String())])),
	sorts: Type.Optional(Type.Union([Type.String(), Type.Array(Type.String())]))
})
