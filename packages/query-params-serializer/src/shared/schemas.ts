import { type TSchemaOptions, Type } from '@package/json-schema'

export const QueryStringParameterSchema = (options?: TSchemaOptions) => {
	return Type.Union([Type.String(), Type.Array(Type.String())], options)
}

export const QueryParametersSchema = Type.Object({
	size: Type.Optional(Type.Integer()),
	after: Type.Optional(Type.String()),
	before: Type.Optional(Type.String()),
	filters: Type.Optional(QueryStringParameterSchema()),
	sorts: Type.Optional(QueryStringParameterSchema())
})
