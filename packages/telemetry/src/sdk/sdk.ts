import { FastifyOtelInstrumentation } from '@fastify/otel'
import { diag } from '@opentelemetry/api'
import { AmqplibInstrumentation } from '@opentelemetry/instrumentation-amqplib'
import { DnsInstrumentation } from '@opentelemetry/instrumentation-dns'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { NetInstrumentation } from '@opentelemetry/instrumentation-net'
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg'
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { TypeormInstrumentation } from 'opentelemetry-instrumentation-typeorm'
import type { TelemetryConfig } from '../config/schemas'
import { getResource, getResourceDetectors } from '../resources'
import { getTraceExporter } from './tracer'

let sdk: NodeSDK

export const shutdownTelemetry = async () => {
	await sdk
		?.shutdown()
		.then(() => diag.debug('OpenTelemetry SDK terminated'))
		.catch((error) => diag.error('Error terminating OpenTelemetry SDK', error))
}

export const initializeTelemetrySdk = (config: TelemetryConfig): NodeSDK => {
	if (sdk) {
		return sdk
	}

	sdk = new NodeSDK({
		resourceDetectors: getResourceDetectors(config),
		resource: getResource(config),
		traceExporter: getTraceExporter(config),
		instrumentations: [
			new AmqplibInstrumentation(),
			new DnsInstrumentation(),
			new FastifyOtelInstrumentation(),
			new HttpInstrumentation(),
			new NetInstrumentation(),
			new PinoInstrumentation(),
			new PgInstrumentation(),
			new TypeormInstrumentation()
		]
	})

	try {
		sdk.start()
		diag.info('OpenTelemetry instrumentation started successfully')
	} catch (error) {
		diag.error(
			'Error initializing OpenTelemetry SDK. Your application is not instrumented and will not produce telemetry',
			error
		)
	}

	// Shutdown telemetry on interruption signal
	process.on('SIGTERM', shutdownTelemetry)

	return sdk
}
