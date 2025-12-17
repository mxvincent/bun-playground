import * as process from 'node:process'
import type { LoggerOptions } from 'pino'
import { serializers } from './serializers'
import { isPinoLogLevel, LogLevel } from './types'

/**
 * Get application logger log level
 */
export const getDefaultLogLevel = (): LogLevel => {
	const configuredLogLevel = process.env['TELEMETRY_LOG_LEVEL']
	if (configuredLogLevel) {
		return isPinoLogLevel(configuredLogLevel) ? configuredLogLevel : LogLevel.INFO
	}
	switch (process.env.NODE_ENV) {
		case 'production':
			return LogLevel.INFO
		case 'test':
			return LogLevel.FATAL
		default:
			return LogLevel.TRACE
	}
}

enum JsonLoggerProperty {
	MESSAGE = 'message',
	LEVEL = 'level',
	TIMESTAMP = 'time'
}

/**
 * Generate logger options
 */
export const getLoggerOptions = (): LoggerOptions => {
	const options: LoggerOptions = {
		base: undefined,
		level: getDefaultLogLevel(),
		messageKey: JsonLoggerProperty.MESSAGE,
		redact: {
			paths: ['[*].headers.authorization']
		}
	}

	options.serializers = {
		error: serializers.error
	}

	// Enable pino-pretty for non production environments
	if (process.env.NODE_ENV !== 'production') {
		options.transport = {
			target: 'pino-pretty',
			options: {
				messageKey: JsonLoggerProperty.MESSAGE,
				levelKey: JsonLoggerProperty.LEVEL,
				timestampKey: JsonLoggerProperty.TIMESTAMP,
				colorize: true,
				translateTime: 'HH:MM:ss Z',
				ignore: 'pid,hostname'
			}
		}
	}

	return options
}
