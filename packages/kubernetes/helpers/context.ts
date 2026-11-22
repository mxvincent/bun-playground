import { Chart as CDKChart } from 'cdk8s/lib/chart'
import type { Construct } from 'constructs'
import type { ExternalSecretSpecSecretStoreRef } from '../crds/external-secrets.io'
import type { ObjectMeta } from '../crds/k8s'
import { DEFAULT_SECRET_STORE } from '../plugins/external-secret'
import { LABEL_COMPONENT, LABEL_INSTANCE, LABEL_NAME, LABEL_VERSION } from './labels'
import { getRevision, type RevisionSource } from './revision'
import { getApplicationScope } from './scope'

export type ContextOptions = {
	name: string
	/** Kubernetes namespace of every resource of the chart */
	namespace: string
	revision?: RevisionSource
	/** Secret store the external secrets read from, `DEFAULT_SECRET_STORE` when omitted */
	secretStore?: ExternalSecretSpecSecretStoreRef
	/** Chart holding the resources, created in `scope` when omitted */
	chart?: CDKChart
	/** Scope of the chart, the global scope of the application when omitted */
	scope?: Construct
}

export abstract class Context {
	readonly application: string
	readonly environment: string
	readonly revision: string
	readonly secretStore: ExternalSecretSpecSecretStoreRef
	readonly chart: CDKChart
	readonly name: string
	/** Kubernetes namespace of every resource of the chart */
	readonly namespace: string

	constructor(environment: string, application: string, options: ContextOptions) {
		this.application = application
		this.environment = environment
		this.name = options.name
		this.namespace = options.namespace
		this.revision = getRevision(application, environment, options.revision)
		this.secretStore = options.secretStore ?? DEFAULT_SECRET_STORE
		this.chart =
			options.chart ??
			new CDKChart(options.scope ?? getApplicationScope(application), this.environment, {
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

export type ApplicationContextOptions = Pick<ContextOptions, 'revision' | 'secretStore' | 'scope'>

export class ApplicationContext extends Context {
	constructor(environment: string, application: string, namespace: string, options: ApplicationContextOptions = {}) {
		super(environment, application, {
			...options,
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
			revision: parent.revision,
			secretStore: parent.secretStore
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
