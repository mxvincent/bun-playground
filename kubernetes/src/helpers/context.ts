import { Chart as CDKChart } from 'cdk8s/lib/chart'
import { LABEL_COMPONENT, LABEL_INSTANCE, LABEL_NAME, LABEL_VERSION } from '#/helpers/labels'
import { getRevision } from '#/helpers/revision'
import { getApplicationScope } from '#/helpers/scope'
import type { ObjectMeta } from '#/imports/k8s'
import type { Application } from '#/interfaces/application'
import type { Environment } from '#/interfaces/environment'

export type ContextOptions = {
	name: string
	/** Kubernetes namespace of every resource of the chart */
	namespace: string
	revision?: string
	chart?: CDKChart
}

export abstract class Context {
	readonly application: Application
	readonly environment: Environment
	readonly revision: string
	readonly chart: CDKChart
	readonly name: string
	/** Kubernetes namespace of every resource of the chart */
	readonly namespace: string

	constructor(environment: Environment, application: Application, options: ContextOptions) {
		this.application = application
		this.environment = environment
		this.name = options.name
		this.namespace = options.namespace
		this.revision = options?.revision ?? getRevision(application, environment)
		this.chart =
			options.chart ??
			new CDKChart(getApplicationScope(application), this.environment, {
				labels: this.labels,
				namespace: this.namespace,
				disableResourceNameHashes: true
			})
	}

	get labels(): Record<string, string> {
		return {
			[LABEL_NAME]: this.application,
			[LABEL_VERSION]: this.revision,
			[LABEL_INSTANCE]: this.environment
		}
	}

	get metadata() {
		return {
			name: this.name,
			labels: this.labels
		} satisfies ObjectMeta
	}
}

export class ApplicationContext extends Context {
	constructor(environment: Environment, application: Application, namespace: string) {
		super(environment, application, {
			name: application,
			namespace: `${environment}-${namespace}`
		})
	}

	component(component: string) {
		return new ComponentContext(this, component)
	}
}

export class ComponentContext extends Context {
	parent: ApplicationContext
	component: string

	constructor(parent: ApplicationContext, component: string) {
		super(parent.environment, parent.application, {
			chart: parent.chart,
			name: component,
			namespace: parent.namespace,
			revision: parent.revision
		})
		this.parent = parent
		this.component = component
	}

	override get labels() {
		return {
			...super.labels,
			[LABEL_COMPONENT]: this.component
		}
	}
}
