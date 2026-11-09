import { validate } from '@package/json-schema'
import { TelemetryConfigKey } from './enums'
import { type TelemetryConfig, TelemetryConfigSchema } from './schemas'
import { getConfigValue } from './values'

/**
 * Build the telemetry configuration from the environment.
 * Environment values are strings: they are coerced to the schema types (e.g. "false" to a boolean).
 */
export const getTelemetryConfig = (): TelemetryConfig => {
	return validate(
		TelemetryConfigSchema,
		{
			service: {
				namespace: getConfigValue(TelemetryConfigKey.SERVICE_NAMESPACE),
				name: getConfigValue(TelemetryConfigKey.SERVICE_NAME),
				version: getConfigValue(TelemetryConfigKey.SERVICE_VERSION)
			},
			exporter: {
				type: getConfigValue(TelemetryConfigKey.EXPORTER_TYPE)
			},
			detectors: {
				container: getConfigValue(TelemetryConfigKey.DETECTOR_CONTAINER)
			}
		},
		{ coerce: true }
	)
}
