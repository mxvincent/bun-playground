import { diag } from '@opentelemetry/api'
import { getTelemetryConfig } from './config/config'
import { isTelemetryEnabled } from './config/values'
import { initializeTelemetrySdk } from './sdk/sdk'

if (isTelemetryEnabled) {
	initializeTelemetrySdk(getTelemetryConfig())
} else {
	diag.debug('Skipping OpenTelemetry sdk initialization because configuration is missing.')
}
