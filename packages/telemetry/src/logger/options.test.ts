import { afterEach, describe, expect, it } from 'bun:test'
import { getDefaultLogLevel, getLoggerOptions } from './options'
import { serializers } from './serializers'
import { LogLevel } from './types'

const initialEnvironment = { NODE_ENV: process.env.NODE_ENV, TELEMETRY_LOG_LEVEL: process.env.TELEMETRY_LOG_LEVEL }

const setEnvironment = (values: Partial<typeof initialEnvironment>) => {
	for (const [name, value] of Object.entries(values)) {
		if (value === undefined) {
			delete process.env[name]
		} else {
			process.env[name] = value
		}
	}
}

afterEach(() => {
	setEnvironment(initialEnvironment)
})

describe('getDefaultLogLevel()', () => {
	it('uses TELEMETRY_LOG_LEVEL when it is a log level', () => {
		setEnvironment({ TELEMETRY_LOG_LEVEL: 'warn' })
		expect(getDefaultLogLevel()).toBe(LogLevel.WARN)
	})

	it('falls back to info when TELEMETRY_LOG_LEVEL is not a log level', () => {
		setEnvironment({ TELEMETRY_LOG_LEVEL: 'verbose' })
		expect(getDefaultLogLevel()).toBe(LogLevel.INFO)
	})

	it.each([
		['production', LogLevel.INFO],
		['test', LogLevel.FATAL],
		['development', LogLevel.TRACE]
	])('defaults to the level of NODE_ENV=%s: %s', (environment, level) => {
		setEnvironment({ TELEMETRY_LOG_LEVEL: undefined, NODE_ENV: environment })
		expect(getDefaultLogLevel()).toBe(level)
	})
})

describe('getLoggerOptions()', () => {
	it('writes the message in a "message" property', () => {
		expect(getLoggerOptions().messageKey).toBe('message')
	})

	it('redacts authorization headers', () => {
		expect(getLoggerOptions().redact).toStrictEqual({ paths: ['[*].headers.authorization'] })
	})

	it('serializes errors', () => {
		expect(getLoggerOptions().serializers?.error).toBe(serializers.error)
	})

	it('pretty prints outside production', () => {
		setEnvironment({ NODE_ENV: 'development' })
		expect(getLoggerOptions().transport).toMatchObject({ target: 'pino-pretty' })
	})

	it('writes JSON in production', () => {
		setEnvironment({ NODE_ENV: 'production' })
		expect(getLoggerOptions().transport).toBeUndefined()
	})
})
