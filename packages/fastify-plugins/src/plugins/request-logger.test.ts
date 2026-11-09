import { afterAll, beforeAll, beforeEach, expect, it, mock, spyOn } from 'bun:test'
import { logger } from '@package/telemetry'
import Fastify from 'fastify'
import { fastifyRequestContext } from './request-context'
import { fastifyRequestLogger } from './request-logger'

const requestLogger = { info: mock(), warn: mock(), error: mock() }
const childSpy = spyOn(logger, 'child').mockReturnValue(requestLogger as never)

const app = Fastify()

beforeAll(async () => {
	await app.register(fastifyRequestContext)
	await app.register(fastifyRequestLogger)
	app.get('/status/:code', async (request, reply) =>
		reply.code(Number((request.params as { code: string }).code)).send()
	)
	await app.ready()
})

beforeEach(() => {
	for (const log of Object.values(requestLogger)) {
		log.mockClear()
	}
})

afterAll(async () => {
	childSpy.mockRestore()
	await app.close()
})

it('logs the start of a request', async () => {
	await app.inject({ url: '/status/200' })
	expect(requestLogger.info).toHaveBeenCalledWith(expect.anything(), 'Request started')
})

it.each([
	[200, 'info'],
	[404, 'warn'],
	[500, 'error']
] as const)('logs a %p response at the %s level', async (code, level) => {
	await app.inject({ url: `/status/${code}` })
	expect(requestLogger[level]).toHaveBeenCalledWith(
		expect.objectContaining({ response: expect.objectContaining({ statusCode: code }) }),
		'Request completed'
	)
})
