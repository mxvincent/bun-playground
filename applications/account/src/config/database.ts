import { EnvValue } from '@package/core'
import { Type } from '@package/json-schema'

export const schema = Type.Object({
	host: Type.String({ default: '127.0.0.1' }),
	port: Type.Integer({ default: 5432 }),
	schema: Type.String({ default: 'account' }),
	database: Type.String({ default: 'applications' }),
	username: Type.String({ default: 'mxvincent' }),
	password: Type.String({ default: 'mxvincent' })
})

export const environment = {
	host: EnvValue.string('DB_HOST'),
	port: EnvValue.number('DB_PORT'),
	database: EnvValue.string('DB_DATABASE'),
	schema: EnvValue.string('DB_SCHEMA'),
	username: EnvValue.string('DB_USERNAME'),
	password: EnvValue.string('DB_PASSWORD')
}
