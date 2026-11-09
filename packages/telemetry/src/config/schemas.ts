import { type Static, Type } from '@package/json-schema'

export const HTTPExporterSchema = Type.Object(
	{
		type: Type.Literal('HTTP'),
		url: Type.Optional(Type.String({ format: 'uri' }))
	},
	{
		description: 'HTTP exporter is designed to be used in local environment'
	}
)

export const TelemetryConfigSchema = Type.Object(
	{
		service: Type.Object({
			namespace: Type.String({ description: 'Application environment.' }),
			name: Type.String({ description: 'Application name.' }),
			version: Type.String({ description: 'Application version.' })
		}),
		exporter: HTTPExporterSchema,
		detectors: Type.Object(
			{
				container: Type.Boolean({ default: false })
			},
			{ default: {} }
		)
	},
	{
		description: 'OpenTelemetry config.'
	}
)

export type TelemetryConfig = Static<typeof TelemetryConfigSchema>
