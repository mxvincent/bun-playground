import type { Logger } from '@package/telemetry'
import type { Logger as TypeormLogger } from 'typeorm'

const withPrefix = (message: string, prefix = 'Database') => `[${prefix}] ${message}`

export class PinoLoggerAdapter implements TypeormLogger {
	private readonly logger: Logger

	constructor(logger: Logger) {
		this.logger = logger
	}

	log(level: 'log' | 'info' | 'warn', message: string): void {
		switch (level) {
			case 'warn':
				this.logger.warn(withPrefix(message))
				break
			default:
				this.logger.trace(withPrefix(message))
		}
	}

	/**
	 * Logs query and parameters used in it.
	 */
	logQuery(query: string, parameters?: unknown[]): void {
		this.logger.debug({ query, parameters }, withPrefix('query completed'))
	}

	/**
	 * Logs query that is failed.
	 */
	logQueryError(error: string | Error, query: string, parameters?: unknown[]): void {
		this.logger.error({ query, parameters, error }, withPrefix('query failed'))
	}

	/**
	 * Logs query that is slow.
	 */
	logQuerySlow(duration: number, query: string, parameters?: unknown[]): void {
		this.logger.warn({ query, parameters, duration }, withPrefix('long query detected'))
	}

	/**
	 * Logs events from the migrations run process.
	 */
	logMigration(message: string): void {
		this.logger.info(withPrefix(message, 'DatabaseMigration'))
	}

	/**
	 * Logs events from the schema build process.
	 */
	logSchemaBuild(message: string): void {
		this.logger.info(withPrefix(message, 'DatabaseSchema'))
	}
}
