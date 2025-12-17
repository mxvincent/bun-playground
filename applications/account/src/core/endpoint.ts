import type { TSchema, TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import type {
	ContextConfigDefault,
	FastifyReply,
	FastifyRequest,
	RawReplyDefaultExpression,
	RawRequestDefaultExpression,
	RawServerDefault
} from 'fastify'
import type { RouteGenericInterface } from 'fastify/types/route'
import type { FastifySchema } from 'fastify/types/schema'

export type RequestFromSchema<TSchema extends FastifySchema> = FastifyRequest<
	RouteGenericInterface,
	RawServerDefault,
	RawRequestDefaultExpression,
	TSchema,
	TypeBoxTypeProvider
>

export type ReplyFromSchema<TSchema extends FastifySchema> = FastifyReply<
	RouteGenericInterface,
	RawServerDefault,
	RawRequestDefaultExpression,
	RawReplyDefaultExpression,
	ContextConfigDefault,
	TSchema,
	TypeBoxTypeProvider
>

export interface RequestSchema {
	body?: TSchema
	querystring?: TSchema
	params?: TSchema
	headers?: TSchema
	response?: Record<number, TSchema>
}

export const endpoint = <Schema extends RequestSchema>(
	schema: Schema,
	handler: (request: RequestFromSchema<typeof schema>, reply: ReplyFromSchema<typeof schema>) => Promise<unknown>
) => {
	return { handler, schema }
}
