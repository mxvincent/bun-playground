import type { WorkloadConfig } from '#/components/config/workload-config'
import type { WorkloadEnvironment } from '#/components/config/workload-environment'
import type { WorkloadComponent } from '#/components/workload-component'
import type { ApplicationContext, ComponentContext } from '#/helpers/context'

/**
 * Application chart is the top level abstraction for deploying a complete application to Kubernetes.
 */
export abstract class ApplicationChart {
	/**
	 * Application context
	 */
	readonly context: ApplicationContext

	/**
	 * Create application manifests
	 */
	constructor(context: ApplicationContext) {
		this.context = context
		for (const component of this.components(context)) {
			component.configure({
				config: this.config,
				environment: this.environment
			})
			component.generate()
		}
	}

	abstract components(context: ApplicationContext): WorkloadComponent[]
	abstract config(context: ComponentContext): WorkloadConfig
	abstract environment(context: ComponentContext): WorkloadEnvironment
}
