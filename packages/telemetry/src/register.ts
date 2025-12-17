import { diag } from '@opentelemetry/api'
import { validate } from '@package/json-schema'
import { TelemetryConfigKey } from './config/enums'
import { TelemetryConfigSchema } from './config/schemas'
import { getConfigValue, isTelemetryEnabled } from './config/values'
import { initializeTelemetrySdk } from './sdk/sdk'

if (isTelemetryEnabled) {
	const config = validate(TelemetryConfigSchema, {
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
	})
	initializeTelemetrySdk(config)
} else {
	diag.debug('Skipping OpenTelemetry sdk initialization because configuration is missing.')
}
