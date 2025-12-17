import type { IncomingMessage, ServerResponse } from 'node:http'
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { generateUUID } from '@package/core'
import {
	fastifyAuth,
	fastifyErrorHandler,
	fastifyRequestContext,
	fastifyRequestLogger,
	fastifyRequestSchemaValidator,
	fastifyResponseTime
} from '@package/fastify-plugins'
import { type Logger, logger } from '@package/telemetry'
import fastify, { type FastifyInstance } from 'fastify'
import type { RawServerDefault } from 'fastify/types/utils'
import { api } from '#/api/api'
import { config } from '#/core/config'

export async function initializeAppServer(): Promise<
	FastifyInstance<RawServerDefault, IncomingMessage, ServerResponse, Logger, TypeBoxTypeProvider>
> {
	const app = fastify({
		loggerInstance: logger,
		disableRequestLogging: true,
		keepAliveTimeout: config.server.keepAliveTimeoutInMilliseconds,
		genReqId: () => generateUUID(7)
	}).withTypeProvider<TypeBoxTypeProvider>()

	// Register plugins
	// await app.register(fastifyHelmet)
	await app.register(fastifyAuth)
	await app.register(fastifyRequestContext)
	await app.register(fastifyRequestLogger)
	await app.register(fastifyRequestSchemaValidator)
	await app.register(fastifyResponseTime)
	await app.register(fastifyErrorHandler)

	// Register API endpoints
	await app.register(api)

	return app
}
