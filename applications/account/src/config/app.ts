import { type DeriveJsonType, EnvValue, TimeZone } from '@package/core'
import { type Static, Type } from '@package/json-schema'
import { LogLevel } from '@package/telemetry'
import { Environment } from 'kubernetes/src/interfaces/environment'

export const schema = Type.Object({
	logLevel: Type.Enum(LogLevel, { default: 'info' }),
	timeZone: Type.Enum(TimeZone, { default: TimeZone.UTC }),
	environment: Type.Enum(Environment, { default: 'development' })
})

export const environment: DeriveJsonType<Static<typeof schema>> = {
	logLevel: EnvValue.string('LOG_LEVEL'),
	timeZone: EnvValue.string('TIME_ZONE'),
	environment: EnvValue.string('NODE_ENV')
}
