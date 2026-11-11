import { accountService } from '#/charts/account-service'
import type { WorkloadNamespace } from '#/helpers/namespace'
import { synthesizeAllResources } from '#/helpers/scope'
import { Environment } from '#/interfaces/environment'

const namespaces: WorkloadNamespace[] = [accountService]

for (const environment of Object.values(Environment)) {
	for (const namespace of namespaces) {
		namespace.generate(environment)
	}
}

synthesizeAllResources()
