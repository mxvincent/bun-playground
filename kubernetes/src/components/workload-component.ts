import {
	type AbstractPod,
	type Container,
	type ContainerProps,
	EnvValue,
	type PodSecurityContextProps
} from 'cdk8s-plus-33'
import type { ImageRegistryAuth } from '#/components/config/registry-auth'
import type { WorkloadConfig } from '#/components/config/workload-config'
import type { WorkloadEnvironment } from '#/components/config/workload-environment'
import { CONFIG_DIRECTORY, CONFIG_FILE_NAME, CONFIG_FILE_PATH, type ConfigProviders } from '#/components/shared'
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

	/**
	 * Environment variables of the workload container
	 *
	 * When a config file is mounted, point the application to it (`CONFIG_FILE_PATH`) and run it in production mode
	 * (`NODE_ENV`). Values from the workload environment take precedence over these defaults, so an explicit value is
	 * never replaced.
	 */
	protected get envVariables(): Record<string, EnvValue> {
		const defaults: Record<string, EnvValue> = {}
		if (this.config && Object.hasOwn(this.config.templates, CONFIG_FILE_NAME)) {
			defaults.CONFIG_FILE_PATH = EnvValue.fromValue(CONFIG_FILE_PATH)
			defaults.NODE_ENV = EnvValue.fromValue('production')
		}
		return { ...defaults, ...this.environment?.values }
	}

	protected get containerProps(): ContainerProps {
		return {
			name: this.context.component,
			command: this.options.command,
			image: this.options.image ?? `ghcr.io/mxvincent/${this.context.application}:${this.context.revision}`,
			resources: getContainerResources(),
			envVariables: this.envVariables,
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
		// Handle application reload on secret change
		const secrets: string[] = []
		if (this.config) {
			// Inject configuration
			this.config.mount(pod, { container, path: CONFIG_DIRECTORY })
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
