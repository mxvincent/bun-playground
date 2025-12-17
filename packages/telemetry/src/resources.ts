import { containerDetector } from '@opentelemetry/resource-detector-container'
import {
	type Detector,
	type DetectorSync,
	envDetectorSync,
	hostDetectorSync,
	type IResource,
	processDetectorSync,
	Resource,
	type ResourceDetectionConfig
} from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'
import type { TelemetryConfig } from './config/schemas'

const ATTR_SERVICE_NAMESPACE = 'service.namespace'

const awaitAttributes = (detector: DetectorSync): Detector => {
	return {
		async detect(config?: ResourceDetectionConfig): Promise<IResource> {
			const resource = detector.detect(config)
			await resource.waitForAsyncAttributes?.()
			return resource
		}
	}
}

export const getResourceDetectors = (config: TelemetryConfig): Detector[] => {
	const detectors = [
		awaitAttributes(envDetectorSync),
		awaitAttributes(processDetectorSync),
		awaitAttributes(hostDetectorSync)
	]
	if (config.detectors.container) {
		detectors.push(containerDetector as never as Detector)
	}
	return detectors
}

export const getResource = ({ service }: TelemetryConfig) => {
	return new Resource({
		[ATTR_SERVICE_NAMESPACE]: service.namespace,
		[ATTR_SERVICE_NAME]: service.name,
		[ATTR_SERVICE_VERSION]: service.version
	})
}
