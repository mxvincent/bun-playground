import { afterEach, expect, it } from 'bun:test'
import { TelemetryConfigKey } from './enums'
import { getConfigValue } from './values'

// The tests set or clear every key, so the ambient environment never leaks into them
const KEYS = Object.values(TelemetryConfigKey)
const initialValues = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]))

afterEach(() => {
	for (const key of KEYS) {
		if (initialValues[key] === undefined) {
			delete process.env[key]
		} else {
			process.env[key] = initialValues[key]
		}
	}
})

it('reads the value from the environment', () => {
	process.env[TelemetryConfigKey.SERVICE_NAME] = 'account'
	expect(getConfigValue(TelemetryConfigKey.SERVICE_NAME)).toBe('account')
})

it('falls back to the default value', () => {
	// The container detector defaults to "false" whatever NODE_ENV is
	delete process.env[TelemetryConfigKey.DETECTOR_CONTAINER]
	expect(getConfigValue(TelemetryConfigKey.DETECTOR_CONTAINER)).toBe('false')
})

it('throws when a value without default is missing', () => {
	delete process.env[TelemetryConfigKey.SERVICE_NAME]
	expect(() => getConfigValue(TelemetryConfigKey.SERVICE_NAME)).toThrow(
		'Environment variable is missing: TELEMETRY_SERVICE_NAME'
	)
})
