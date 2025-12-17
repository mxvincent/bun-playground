import { BaseError } from '@package/errors'
import type { FastifyError, FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import plugin from 'fastify-plugin'

export const fastifyErrorHandler: FastifyPluginAsync = plugin(
	async (app: FastifyInstance): Promise<void> => {
		app.setErrorHandler(async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
			app.log.error({ error, request }, 'Unhandled error')

			if (error instanceof BaseError) {
				console.log(error.toJSON())
				reply.statusCode = error.statusCode
				return error.toJSON()
			}

			return reply.send(error)
		})
	},
	{
		fastify: '5.x'
	}
)
