import plugin from 'fastify-plugin'

export type Actor = {
	type: 'user' | 'service'
	id: string
}

declare module 'fastify' {
	interface FastifyRequest {
		actor: Actor | null
	}
}

export const fastifyAuth = plugin(
	async (instance) => {
		instance.decorateRequest('auth', null)
		instance.addHook('onRequest', async (request) => {
			request.actor = {
				type: 'user',
				id: '123'
			}
		})
	},
	{
		fastify: '5.x'
	}
)
