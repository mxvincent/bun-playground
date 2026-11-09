import { afterEach, beforeEach, expect, it } from 'bun:test'
import { getTelemetryConfig } from './config'
import { TelemetryConfigKey } from './enums'

// The tests set or clear every key, so the ambient environment never leaks into them
const KEYS = Object.values(TelemetryConfigKey)
const initialValues = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]))

beforeEach(() => {
	// Namespace, version and exporter type are set because their defaults depend on NODE_ENV
	process.env[TelemetryConfigKey.SERVICE_NAMESPACE] = 'staging'
	process.env[TelemetryConfigKey.SERVICE_NAME] = 'account'
	process.env[TelemetryConfigKey.SERVICE_VERSION] = '1.0.0'
	process.env[TelemetryConfigKey.EXPORTER_TYPE] = 'HTTP'
})

afterEach(() => {
	for (const key of KEYS) {
		if (initialValues[key] === undefined) {
			delete process.env[key]
		} else {
			process.env[key] = initialValues[key]
		}
	}
})

it('builds the configuration from the environment and its defaults', () => {
	delete process.env[TelemetryConfigKey.DETECTOR_CONTAINER]
	expect(getTelemetryConfig()).toStrictEqual({
		service: { namespace: 'staging', name: 'account', version: '1.0.0' },
		exporter: { type: 'HTTP' },
		detectors: { container: false }
	})
})

it.each([
	['true', true],
	['false', false]
])('reads the container detector flag %p as a boolean', (value, container) => {
	process.env[TelemetryConfigKey.DETECTOR_CONTAINER] = value
	expect(getTelemetryConfig().detectors.container).toBe(container)
})
