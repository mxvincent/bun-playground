import { describe, expect, it } from 'bun:test'
import type { TelemetryConfig } from './config/schemas'
import { getResource, getResourceDetectors } from './resources'

const config = (container: boolean): TelemetryConfig => ({
	service: { namespace: 'local', name: 'account', version: '1.0.0' },
	exporter: { type: 'HTTP' },
	detectors: { container }
})

it('getResource() describes the service', () => {
	expect(getResource(config(false)).attributes).toStrictEqual({
		'service.namespace': 'local',
		'service.name': 'account',
		'service.version': '1.0.0'
	})
})

describe('getResourceDetectors()', () => {
	it('detects the environment, the process and the host', () => {
		expect(getResourceDetectors(config(false))).toHaveLength(3)
	})

	it('also detects the container when enabled', () => {
		expect(getResourceDetectors(config(true))).toHaveLength(4)
	})
})
