import { EnvValue } from '@package/core'
import { Type } from '@package/json-schema'

export const schema = Type.Object({
	host: Type.String({ default: '127.0.0.1' }),
	port: Type.Integer({ default: 5432 }),
	schema: Type.String({ default: 'account' }),
	database: Type.String({ default: 'test_account' }),
	username: Type.String({ default: 'mxvincent' }),
	password: Type.String({ default: 'mxvincent' })
})

export const environment = {
	host: EnvValue.string('POSTGRES_HOST'),
	port: EnvValue.number('POSTGRES_PORT'),
	database: EnvValue.string('POSTGRES_DATABASE'),
	schema: EnvValue.string('POSTGRES_SCHEMA'),
	username: EnvValue.string('POSTGRES_USERNAME'),
	password: EnvValue.string('POSTGRES_PASSWORD')
}
