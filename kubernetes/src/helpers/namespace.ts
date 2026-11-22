import type { Chart } from 'cdk8s/lib/chart'
import { type ImageRegistry, ImageRegistryAuth } from '#/components/config/registry-auth'
import { type ConfigFiles, mergeConfigFiles, WorkloadConfig } from '#/components/config/workload-config'
import { type EnvironmentVariables, WorkloadEnvironment } from '#/components/config/workload-environment'
import type { WorkloadComponent } from '#/components/workload-component'
import { ApplicationContext } from '#/helpers/context'
import { type Resolvable, resolve } from '#/helpers/resolvable'
import type { Application } from '#/interfaces/application'
import type { Environment } from '#/interfaces/environment'

/**
 * Declaration of a workload namespace
 */
export interface WorkloadNamespaceOptions {
	/** Name of the namespace */
	readonly name: string
	/** Application providing the image and the revision run by every component */
	readonly application: Application
	/** Registry the image of the application is pulled from */
	readonly imageRegistry: ImageRegistry
	/** Config files shared by the components, by file name */
	readonly config?: Resolvable<ConfigFiles>
	/** Environment variables shared by the components */
	readonly environment?: Resolvable<EnvironmentVariables>
	/** Components of the namespace, with unique names */
	readonly components: readonly WorkloadComponent[]
}

/**
 * A workload namespace: an application (or a domain) and the components it runs
 */
export interface WorkloadNamespace {
	readonly name: string
	readonly application: Application
	/** Generate the chart of the namespace for one environment */
	generate(environment: Environment): Chart
}

/**
 * Declare a workload namespace
 *
 * Each component extends the settings of the namespace: its config files are deep-merged into the namespace ones and
 * its environment variables are merged with the namespace ones. The component wins on conflicts.
 */
export const defineNamespace = (options: WorkloadNamespaceOptions): WorkloadNamespace => {
	const names = new Set<string>()
	for (const component of options.components) {
		if (names.has(component.name)) {
			throw new Error(`Duplicate component name in namespace ${options.name}: ${component.name}`)
		}
		names.add(component.name)
	}
	return {
		name: options.name,
		application: options.application,
		generate(environment) {
			const context = new ApplicationContext(environment, options.application)
			const { url, auth } = options.imageRegistry
			const image = `${url}/${context.application}:${context.revision}`
			const imagePullSecret = auth && new ImageRegistryAuth(context, auth).secret
			for (const component of options.components) {
				const componentContext = context.component(component.name)
				const config = mergeConfigFiles(
					resolve(options.config, componentContext),
					resolve(component.options.config, componentContext)
				)
				const variables = {
					...resolve(options.environment, componentContext),
					...resolve(component.options.environment, componentContext)
				}
				component.generate(componentContext, {
					image,
					imagePullSecret,
					config: config && new WorkloadConfig(componentContext, config),
					environment: Object.keys(variables).length ? new WorkloadEnvironment(componentContext, variables) : undefined
				})
			}
			return context.chart
		}
	}
}
