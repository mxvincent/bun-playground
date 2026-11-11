import { describe, expect, test } from 'bun:test'
import { accountService } from '#/charts/account-service'
import { revisions } from '#/helpers/revision'
import { getApplicationScope } from '#/helpers/scope'
import { Application } from '#/interfaces/application'
import { Environment } from '#/interfaces/environment'

describe('AccountService', () => {
	test('synthesizes the manifests of every environment', () => {
		// Pin the revision so that releasing the account application does not change the snapshot
		revisions.set(Application.ACCOUNT, '0.0.0-snapshot')
		for (const environment of Object.values(Environment)) {
			accountService.generate(environment)
		}
		const scope = getApplicationScope(Application.ACCOUNT)
		expect(scope.charts.map((chart) => chart.node.id)).toEqual(Object.values(Environment))
		expect(scope.synthYaml()).toMatchSnapshot()
	})
})
