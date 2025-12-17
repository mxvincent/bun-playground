import { Schema } from '@package/json-schema'

export const QueryParametersSchema = Schema.Object({
	size: Schema.Optional(Schema.Integer()),
	after: Schema.Optional(Schema.String()),
	before: Schema.Optional(Schema.String()),
	filters: Schema.Optional(Schema.Union([Schema.String(), Schema.Array(Schema.String())])),
	sorts: Schema.Optional(Schema.Union([Schema.String(), Schema.Array(Schema.String())]))
})
