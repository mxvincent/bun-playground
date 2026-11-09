import pino, { type DestinationStream, type LoggerOptions } from 'pino'
import { getLoggerOptions } from './options'
import type { LogLevel } from './types'

export const logger = pino(getLoggerOptions())

/**
 * Create a logger writing synchronously, with the options of `logger`.
 * Outside production, the options use the pino-pretty transport, which takes over the destination.
 */
export const createSyncLogger = (
	options: LoggerOptions = getLoggerOptions(),
	destination: DestinationStream = pino.destination({ sync: true })
) => {
	return options.transport ? pino(options) : pino(options, destination)
}

export const syncLogger = createSyncLogger()

export const setLogLevel = (level: LogLevel): void => {
	logger.level = level
	syncLogger.level = level
}
