import type { Static, TSchema } from '@package/json-schema'
import type {
	FastifyReply,
	FastifyRequest,
	FastifyTypeProvider,
	RawRequestDefaultExpression,
	RawServerDefault
} from 'fastify'
import type { RouteGenericInterface } from 'fastify/types/route'
export interface TypeProvider extends FastifyTypeProvider {
	validator: this['schema'] extends TSchema ? Static<this['schema']> : unknown
	serializer: this['schema'] extends TSchema ? Static<this['schema']> : unknown
}

type ExtractStatic<T> = T extends TSchema ? Static<T> : never

type RouteGenerics<Schema extends RequestSchema> = RouteGenericInterface & {
	Body: Schema['body'] extends TSchema ? ExtractStatic<Schema['body']> : unknown
	Querystring: Schema['querystring'] extends TSchema ? ExtractStatic<Schema['querystring']> : unknown
	Params: Schema['params'] extends TSchema ? ExtractStatic<Schema['params']> : unknown
	Headers: Schema['headers'] extends TSchema ? ExtractStatic<Schema['headers']> : unknown
}

type RequestFromSchema<TSchema extends RequestSchema> = FastifyRequest<
	RouteGenerics<TSchema>,
	RawServerDefault,
	RawRequestDefaultExpression
>

type ReplyFromSchema<TSchema extends RequestSchema> = FastifyReply<RouteGenerics<TSchema>>

export type RequestSchema = {
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
	return { handler, schema } as const
}
