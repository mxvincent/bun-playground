import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import plugin from 'fastify-plugin'
import { requestContext } from './request-context.js'

export const fastifyRequestLogger: FastifyPluginAsync = plugin(
	async (app: FastifyInstance): Promise<void> => {
		app.addHook('onRequest', async () => {
			const context = requestContext.getStore()
			if (!context) {
				return
			}
			context.logger.info({ actor: context.actor, request: context.request }, 'Request started')
		})

		app.addHook('onResponse', async (_, response) => {
			const context = requestContext.getStore()
			if (!context) {
				return
			}
			const severity = response.statusCode < 400 ? 'info' : response.statusCode < 500 ? 'warn' : 'error'
			context.logger[severity](
				{
					actor: context.actor,
					request: context.request,
					response: {
						statusCode: response.statusCode,
						elapsedTime: response.elapsedTime
					}
				},
				'Request completed'
			)
		})
	},
	{
		fastify: '5.x'
	}
)
