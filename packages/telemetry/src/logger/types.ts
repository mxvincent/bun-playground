export type { Logger } from 'pino'

export enum LogLevel {
	TRACE = 'trace',
	DEBUG = 'debug',
	INFO = 'info',
	WARN = 'warn',
	ERROR = 'error',
	FATAL = 'fatal',
	SILENT = 'silent'
}

/**
 * Ensure value is a valid pino log level
 */
export const isPinoLogLevel = (level: string): level is LogLevel => {
	return Object.values(LogLevel).includes(level as never)
}
