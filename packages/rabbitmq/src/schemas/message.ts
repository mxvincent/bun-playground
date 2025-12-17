import { Schema, type Static, type TSchema } from '@package/json-schema'

/**
 * Message metadata schema factory
 */
export const AmqpMessageMetadataSchema = Schema.Object({
	id: Schema.String(),
	date: Schema.String(),
	event: Schema.String(),
	owner: Schema.Optional(Schema.Object({ type: Schema.String(), id: Schema.String() }))
})
export type AmqpMessageMetadata = Static<typeof AmqpMessageMetadataSchema>

/**
 * Message schema factory
 */
export const createMessageSchema = <T extends TSchema>(payloadSchema: T) => {
	return Schema.Object({
		metadata: AmqpMessageMetadataSchema,
		payload: payloadSchema
	})
}
export const AmqpMessageSchema = Schema.Object({
	metadata: AmqpMessageMetadataSchema,
	payload: Schema.Any()
})
export type Message = Static<typeof AmqpMessageSchema>
