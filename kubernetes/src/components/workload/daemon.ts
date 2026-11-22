import { Deployment } from 'cdk8s-plus-33'
import {
	WorkloadComponent,
	type WorkloadComponentOptions,
	type WorkloadSettings
} from '#/components/workload-component'
import type { ComponentContext } from '#/helpers/context'

export interface DaemonOptions extends WorkloadComponentOptions {
	readonly replicas?: number
}

export class Daemon extends WorkloadComponent<DaemonOptions> {
	generate(context: ComponentContext, settings: WorkloadSettings) {
		const { options } = this

		// Configure deployment
		const deployment = new Deployment(context.chart, context.name, {
			metadata: context.metadata,
			replicas: options.replicas ?? 1,
			dockerRegistryAuth: settings.imagePullSecret,
			podMetadata: context.metadata,
			securityContext: this.securityContext
		})

		// Configure deployment container
		const container = deployment.addContainer(this.containerProps(context, settings))

		// Inject configuration
		this.mountConfiguration(deployment, container, settings)
	}
}
