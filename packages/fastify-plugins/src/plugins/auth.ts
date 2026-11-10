import plugin from 'fastify-plugin'

export type Actor = {
	type: 'user' | 'service'
	id: string
}

declare module 'fastify' {
	interface FastifyRequest {
		/**
		 * Authenticated actor of the request, `null` for an anonymous request
		 */
		actor: Actor | null
	}
}

/**
 * Declare the actor of every request.
 * No authentication is implemented yet: every request is anonymous (`actor` is `null`).
 * An authentication sets `request.actor` in an `onRequest` hook.
 */
export const fastifyAuth = plugin(
	async (instance) => {
		instance.decorateRequest('actor', null)
	},
	{
		fastify: '5.x'
	}
)
