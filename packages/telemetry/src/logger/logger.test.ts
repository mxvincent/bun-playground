import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { createSyncLogger, logger, syncLogger } from './logger'
import { getLoggerOptions } from './options'

it('syncLogger has the level of logger', () => {
	expect(syncLogger.level).toBe(logger.level)
})

describe('createSyncLogger() with the production options', () => {
	const initialEnvironment = process.env.NODE_ENV
	const lines: string[] = []

	beforeAll(() => {
		process.env.NODE_ENV = 'production'
		const syncProductionLogger = createSyncLogger(getLoggerOptions(), { write: (line) => lines.push(line) })
		syncProductionLogger.info({ request: { headers: { authorization: 'Bearer secret' } } }, 'request')
	})

	afterAll(() => {
		process.env.NODE_ENV = initialEnvironment
	})

	it('writes the message in a "message" property', () => {
		expect(JSON.parse(lines.join(''))).toMatchObject({ message: 'request' })
	})

	it('redacts authorization headers', () => {
		expect(JSON.parse(lines.join('')).request.headers.authorization).toBe('[Redacted]')
	})
})
