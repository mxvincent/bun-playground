/**
 * Process started by sdk.test.ts: it starts the SDK, ends a span, then waits to be interrupted.
 * The first argument is the url of the trace exporter.
 */
import { trace } from '@opentelemetry/api'
import { initializeTelemetrySdk } from './sdk'

initializeTelemetrySdk({
	service: { namespace: 'local', name: 'account', version: '1.0.0' },
	exporter: { type: 'HTTP', url: process.argv[2] },
	detectors: { container: false }
})

trace.getTracer('sdk-test').startSpan('pending span').end()

// Keep the process alive until a signal stops it
setInterval(() => undefined, 1000)

console.log('ready')
