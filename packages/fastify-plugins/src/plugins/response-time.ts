import type { FastifyPluginAsync } from 'fastify'
import plugin from 'fastify-plugin'

export const fastifyResponseTime: FastifyPluginAsync = plugin(
	async (app) => {
		app.addHook('onSend', async (_, response) => {
			void response.header('x-response-time', response.elapsedTime)
		})
	},
	{
		fastify: '5.x'
	}
)
