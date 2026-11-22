import {
	type AbstractPod,
	type Container,
	type ContainerProps,
	EnvValue,
	type ISecret,
	type PodSecurityContextProps
} from 'cdk8s-plus-33'
import type { ConfigFiles, WorkloadConfig } from '#/components/config/workload-config'
import type { EnvironmentVariables, WorkloadEnvironment } from '#/components/config/workload-environment'
import { CONFIG_DIRECTORY, CONFIG_FILE_NAME, CONFIG_FILE_PATH } from '#/components/shared'
import type { ComponentContext } from '#/helpers/context'
import type { Resolvable } from '#/helpers/resolvable'
import { getContainerResources } from '#/helpers/resources'
import { ReloaderAnnotation } from '#/plugins/reloader'

export interface WorkloadComponentOptions {
	/** Name of the component, unique in its namespace */
	readonly name: string
	/** Command run by the workload container */
	readonly command: string[]
	/** Config files extending the namespace ones, by file name */
	readonly config?: Resolvable<ConfigFiles>
	/** Environment variables extending the namespace ones */
	readonly environment?: Resolvable<EnvironmentVariables>
}

/**
 * Settings resolved by the namespace for a component
 */
export interface WorkloadSettings {
	/** Image run by the workload container */
	readonly image: string
	/** Secret used to pull the image, when the registry requires authentication */
	readonly imagePullSecret?: ISecret
	readonly config?: WorkloadConfig
	readonly environment?: WorkloadEnvironment
}

/**
 * A component of a workload namespace
 *
 * A component is a declaration: the namespace builds its context and its settings when it generates the manifests.
 */
export abstract class WorkloadComponent<Options extends WorkloadComponentOptions = WorkloadComponentOptions> {
	readonly options: Options

	constructor(options: Options) {
		this.options = options
	}

	get name(): string {
		return this.options.name
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
	protected envVariables(settings: WorkloadSettings): Record<string, EnvValue> {
		const defaults: Record<string, EnvValue> = {}
		if (settings.config && Object.hasOwn(settings.config.templates, CONFIG_FILE_NAME)) {
			defaults.CONFIG_FILE_PATH = EnvValue.fromValue(CONFIG_FILE_PATH)
			defaults.NODE_ENV = EnvValue.fromValue('production')
		}
		return { ...defaults, ...settings.environment?.values }
	}

	protected containerProps(context: ComponentContext, settings: WorkloadSettings): ContainerProps {
		return {
			name: context.component,
			command: this.options.command,
			image: settings.image,
			resources: getContainerResources(),
			envVariables: this.envVariables(settings),
			securityContext: {
				privileged: false,
				readOnlyRootFilesystem: true,
				ensureNonRoot: true,
				allowPrivilegeEscalation: false
			}
		}
	}

	/**
	 * Generate the manifests of the component in its context
	 */
	abstract generate(context: ComponentContext, settings: WorkloadSettings): void

	protected mountConfiguration(pod: AbstractPod, container: Container, settings: WorkloadSettings) {
		// Handle application reload on secret change
		const secrets: string[] = []
		if (settings.config) {
			// Inject configuration
			settings.config.mount(pod, { container, path: CONFIG_DIRECTORY })
			secrets.push(settings.config.secret.name)
		}
		if (settings.environment?.secret) {
			secrets.push(settings.environment.secret.name)
		}
		if (secrets.length) {
			pod.metadata.addAnnotation(ReloaderAnnotation.RELOAD_ON_SECRET_CHANGE, secrets.join(','))
		}
	}
}
