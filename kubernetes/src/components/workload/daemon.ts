import { Deployment } from 'cdk8s-plus-33'
import { WorkloadComponent, type WorkloadComponentOptions } from '#/components/workload-component'

export interface DaemonOptions extends WorkloadComponentOptions {
	readonly replicas?: number
}

export class Daemon extends WorkloadComponent<DaemonOptions> {
	generate() {
		const { context, options } = this

		// Configure deployment
		const deployment = new Deployment(context.chart, context.name, {
			metadata: context.metadata,
			replicas: options.replicas ?? 1,
			dockerRegistryAuth: options.imageRegistryAuth?.secret,
			podMetadata: context.metadata,
			securityContext: this.securityContext
		})

		// Configure deployment container
		const container = deployment.addContainer(this.containerProps)

		// Inject configuration
		this.mountConfiguration(deployment, container)
	}
}
