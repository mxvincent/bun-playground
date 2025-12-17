import type { AbstractPod, Container, ContainerProps, PodSecurityContextProps } from 'cdk8s-plus-33'
import type { ImageRegistryAuth } from '#/components/config/registry-auth'
import type { WorkloadConfig } from '#/components/config/workload-config'
import type { WorkloadEnvironment } from '#/components/config/workload-environment'
import { CONFIG_DIRECTORY, type ConfigProviders } from '#/components/shared'
import type { ComponentContext } from '#/helpers/context'
import { getContainerResources } from '#/helpers/resources'
import { ReloaderAnnotation } from '#/plugins/reloader'

export interface WorkloadComponentOptions {
	readonly command: string[]
	readonly image?: string
	readonly imageRegistryAuth?: ImageRegistryAuth
}

export abstract class WorkloadComponent<Options extends WorkloadComponentOptions = WorkloadComponentOptions> {
	readonly context: ComponentContext
	readonly options: Options
	protected config?: WorkloadConfig
	protected environment?: WorkloadEnvironment

	constructor(context: ComponentContext, options: Options) {
		this.context = context
		this.options = options
	}

	protected get securityContext(): PodSecurityContextProps {
		return {
			fsGroup: 1000,
			user: 1000,
			group: 1000
		}
	}

	protected get containerProps(): ContainerProps {
		return {
			name: this.context.component,
			command: this.options.command,
			image: this.options.image ?? `ghcr.io/mxvincent/${this.context.application}:${this.context.revision}`,
			resources: getContainerResources(),
			envVariables: this.environment?.values,
			securityContext: {
				privileged: false,
				readOnlyRootFilesystem: true,
				ensureNonRoot: true,
				allowPrivilegeEscalation: false
			}
		}
	}

	configure(providers: ConfigProviders) {
		if (this.config || this.environment) {
			throw new Error(`Component is already configured: ${this.context.name}`)
		}
		if (providers.config) {
			this.config = providers.config(this.context)
		}
		if (providers.environment) {
			this.environment = providers.environment(this.context)
		}
	}

	abstract generate(): void

	protected mountConfiguration(pod: AbstractPod, container: Container) {
		if (!this.config) {
			return
		}
		// Inject configuration
		this.config.mount(pod, { container, path: CONFIG_DIRECTORY })
		// Handle application reload on secret change
		const secrets: string[] = []
		if (this.config) {
			secrets.push(this.config.secret.name)
		}
		if (this.environment?.secret) {
			secrets.push(this.environment.secret.name)
		}
		if (secrets.length) {
			pod.metadata.addAnnotation(ReloaderAnnotation.RELOAD_ON_SECRET_CHANGE, secrets.join(','))
		}
	}
}
