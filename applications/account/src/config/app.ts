import { type DeriveJsonType, EnvValue, TimeZone } from '@package/core'
import { type Static, Type } from '@package/json-schema'
import { LogLevel } from '@package/telemetry'

enum Environment {
	DEVELOPMENT = 'development',
	PRODUCTION = 'production',
}

export const schema = Type.Object({
	logLevel: Type.Enum(LogLevel, { default: 'info' }),
	timeZone: Type.Enum(TimeZone, { default: TimeZone.UTC }),
	environment: Type.Enum(Environment, { default: Environment.DEVELOPMENT })
})

export const environment: DeriveJsonType<Static<typeof schema>> = {
	logLevel: EnvValue.string('LOG_LEVEL'),
	timeZone: EnvValue.string('TIME_ZONE'),
	environment: EnvValue.string('NODE_ENV')
}
