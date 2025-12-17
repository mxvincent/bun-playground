import assert from 'assert'
import { TelemetryConfigKey } from './enums'

/**
 * Use otel resource name to define if telemetry should be started
 */
export const isTelemetryEnabled = !!process.env[TelemetryConfigKey.SERVICE_NAME]

/**
 * Configure default values related to the current environment
 */
const defaultValues = new Map<TelemetryConfigKey, string>()

defaultValues.set(TelemetryConfigKey.DETECTOR_CONTAINER, 'false')

if (process.env.NODE_ENV === 'production') {
	// TODO
} else {
	defaultValues.set(TelemetryConfigKey.EXPORTER_TYPE, 'HTTP')
	defaultValues.set(TelemetryConfigKey.SERVICE_NAMESPACE, 'local')
	defaultValues.set(TelemetryConfigKey.SERVICE_VERSION, 'next')
}

/**
 * Try to get a value from environment and use default value as fallback if configured
 */
export const getConfigValue = (key: TelemetryConfigKey): string | undefined => {
	const value = process.env[key] ?? defaultValues.get(key)
	assert.ok(value, `Environment variable is missing: ${key}`)
	return value
}
