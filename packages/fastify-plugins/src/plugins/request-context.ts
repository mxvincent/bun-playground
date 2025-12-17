import { AsyncLocalStorage } from 'node:async_hooks'
import { logger } from '@package/telemetry'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import plugin from 'fastify-plugin'
import type { Actor } from './auth.js'

export type Context = {
	actor: Actor | null
	logger: typeof logger
}

export type RequestContext = Context & {
	request: {
		id: string
		method: string
		path: string
		params: unknown
		headers: Record<string, unknown>
	}
}

export const requestContext = new AsyncLocalStorage<RequestContext>()

export const fastifyRequestContext: FastifyPluginAsync = plugin(
	async (app: FastifyInstance): Promise<void> => {
		app.addHook('onRequest', (request, response, done) => {
			const context = {
				logger: logger.child({
					request: request.id
				}),
				actor: request.actor,
				request: {
					id: request.id,
					method: request.method,
					path: request.routeOptions.url as string,
					params: request.params,
					headers: request.headers
				}
			} satisfies RequestContext
			void response.header('x-request-id', request.id)
			requestContext.run(context, done)
		})
	},
	{
		fastify: '5.x'
	}
)
