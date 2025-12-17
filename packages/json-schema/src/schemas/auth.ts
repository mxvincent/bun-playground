import { Schema } from '../builder'

const algorithms = [
	'HS256',
	'HS384',
	'HS512',
	'RS256',
	'RS384',
	'RS512',
	'ES256',
	'ES384',
	'ES512',
	'PS256',
	'PS384',
	'PS512'
] as const

export const JWTConfigSchema = Schema.Object({
	audience: Schema.String({ format: 'uri' }),
	issuer: Schema.String({ format: 'uri' }),
	jwksUri: Schema.String({ format: 'uri' }),
	algorithms: Schema.StringEnum(algorithms, { default: 'ES512' })
})
