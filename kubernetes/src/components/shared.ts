import type { WorkloadConfig } from '#/components/config/workload-config'
import type { WorkloadEnvironment } from '#/components/config/workload-environment'
import type { ComponentContext, Provider } from '#/helpers/context'

export const CONFIG_DIRECTORY = '/app/config'
export const CONFIG_FILE_NAME = 'config.json'
export const CONFIG_FILE_PATH = `${CONFIG_DIRECTORY}/${CONFIG_FILE_NAME}`

export type ConfigProviders = {
	config?: Provider<WorkloadConfig, ComponentContext>
	environment?: Provider<WorkloadEnvironment, ComponentContext>
}

export type ConfigScope = 'application' | 'component'
