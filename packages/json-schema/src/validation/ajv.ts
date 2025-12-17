import Ajv, { type Options } from 'ajv'
import addFormats from 'ajv-formats'

export type { ErrorObject } from 'ajv'

const DEFAULT_OPTIONS: Options = {
	allErrors: true,
	coerceTypes: false,
	removeAdditional: true,
	useDefaults: true,
	strict: false
} as const

export const schemaCompiler = new Ajv({
	...DEFAULT_OPTIONS
})

export const schemaCompilerWithCoercionEnabled = new Ajv({
	...DEFAULT_OPTIONS,
	coerceTypes: true
})

for (const ajv of [schemaCompiler, schemaCompilerWithCoercionEnabled]) {
	addFormats(ajv)
	ajv
		.addKeyword('exclusiveMinimumTimestamp')
		.addKeyword('exclusiveMaximumTimestamp')
		.addKeyword('minimumTimestamp')
		.addKeyword('maximumTimestamp')
		.addKeyword('minByteLength')
		.addKeyword('maxByteLength')
}
