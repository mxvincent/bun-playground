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

it('exports the traces to the configured url', async () => {
	const requestedPaths: string[] = []
	const server = Bun.serve({
		port: 0,
		fetch(request) {
			requestedPaths.push(new URL(request.url).pathname)
			return new Response(null, { status: 200 })
		}
	})
	try {
		const exporter = getTraceExporter({
			service: { namespace: 'local', name: 'account', version: '1.0.0' },
			exporter: { type: 'HTTP', url: `http://127.0.0.1:${server.port}/custom/traces` },
			detectors: { container: false }
		})
		await new Promise((resolve) => exporter.export([], resolve))
		await exporter.shutdown()
		expect(requestedPaths).toStrictEqual(['/custom/traces'])
	} finally {
		server.stop(true)
	}
})
