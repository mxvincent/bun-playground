import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import type { SpanExporter } from '@opentelemetry/sdk-trace-node'
import type { TelemetryConfig } from '../config/schemas'

/**
 * OTLP over HTTP exporter. Without `url`, the exporter reads OTEL_EXPORTER_OTLP_* variables, then its default URL.
 */
export const getTraceExporter = (config: TelemetryConfig): SpanExporter => {
	return new OTLPTraceExporter({ url: config.exporter.url })
}
