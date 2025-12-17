import pino from 'pino'
import { getLoggerOptions } from './options'
import type { LogLevel } from './types'

export const logger = pino(getLoggerOptions())

export const syncLogger = pino(pino.destination({ sync: true, ...getLoggerOptions() }))

export const setLogLevel = (level: LogLevel): void => {
	logger.level = level
	syncLogger.level = level
}
