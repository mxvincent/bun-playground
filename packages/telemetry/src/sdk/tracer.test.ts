import { expect, it } from 'bun:test'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { getTraceExporter } from './tracer'

it('exports the traces with OTLP over HTTP', () => {
	const exporter = getTraceExporter({
		service: { namespace: 'local', name: 'account', version: '1.0.0' },
		exporter: { type: 'HTTP' },
		detectors: { container: false }
	})
	expect(exporter).toBeInstanceOf(OTLPTraceExporter)
})
