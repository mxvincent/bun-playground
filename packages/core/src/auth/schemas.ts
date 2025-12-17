import { type Static, Type } from '@sinclair/typebox'
import { JWTAlgorithm, JWTAsymmetricAlgorithm, JWTSymmetricAlgorithm } from './types'

const commonProperties = {
	audience: Type.String({ format: 'uri' }),
	issuer: Type.String({ format: 'uri' })
} as const

export const AsymmetricJWTConfigSchema = Type.Object(
	{
		algorithm: Type.Enum(JWTAsymmetricAlgorithm, {
			default: JWTAlgorithm.RS256
		}),
		jwksUri: Type.String({ format: 'uri' }),
		...commonProperties
	},
	{
		additionalProperties: false,
		description: 'JWT config with asymmetric key.'
	}
)
export type AsymmetricJWTConfig = Static<typeof AsymmetricJWTConfigSchema>

export const SymmetricJWTConfigSchema = Type.Object(
	{
		algorithm: Type.Enum(JWTSymmetricAlgorithm, {
			default: JWTAlgorithm.HS256
		}),
		secret: Type.String(),
		...commonProperties
	},
	{
		additionalProperties: false,
		description: 'JWT config with symmetric key.'
	}
)
export type SymmetricJWTConfig = Static<typeof SymmetricJWTConfigSchema>

export const JWTConfigSchema = Type.Union([AsymmetricJWTConfigSchema, SymmetricJWTConfigSchema])
export type JWTConfig = Static<typeof JWTConfigSchema>

export const ASYMMETRIC_ALGORITHMS = Object.values(JWTSymmetricAlgorithm)
export const SYMMETRIC_ALGORITHMS = Object.values(JWTSymmetricAlgorithm)
