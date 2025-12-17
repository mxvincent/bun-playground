import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import type { SpanExporter } from '@opentelemetry/sdk-trace-node'
import type { TelemetryConfig } from '../config/schemas'

export const getTraceExporter = (config: TelemetryConfig): SpanExporter => {
	switch (config.exporter.type) {
		case 'HTTP':
		default:
			return new OTLPTraceExporter()
	}
}
