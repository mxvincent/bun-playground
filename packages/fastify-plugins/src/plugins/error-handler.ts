import { BaseError, InternalServerError } from '@package/errors'
import type { FastifyError, FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import plugin from 'fastify-plugin'

/**
 * Errors produced by Fastify (`FST_` codes) about the request, such as a validation error.
 * Any other error may carry a status code, such as an HTTP client error about an upstream call: it stays internal.
 */
const isFastifyClientError = (error: FastifyError): boolean =>
	error.code?.startsWith('FST_') === true &&
	error.statusCode !== undefined &&
	error.statusCode >= 400 &&
	error.statusCode < 500

export const fastifyErrorHandler: FastifyPluginAsync = plugin(
	async (app: FastifyInstance): Promise<void> => {
		app.setErrorHandler(async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
			app.log.error({ error, request }, 'Unhandled error')

			if (error instanceof BaseError) {
				console.log(error.toJSON())
				reply.statusCode = error.statusCode
				return error.toJSON()
			}

			// Fastify client errors (validation, unsupported media type…) describe the request: keep them
			if (isFastifyClientError(error)) {
				return reply.send(error)
			}

			// Any other error is internal: its message must not reach the client
			const internalError = new InternalServerError('Internal server error')
			reply.statusCode = internalError.statusCode
			return internalError.toJSON()
		})
	},
	{
		fastify: '5.x'
	}
)
