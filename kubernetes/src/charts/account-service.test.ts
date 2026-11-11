import { describe, expect, test } from 'bun:test'
import { App } from 'cdk8s/lib/app'
import { accountService } from '#/charts/account-service'
import { pinRevision } from '#/helpers/revision.testing'
import { Application } from '#/interfaces/application'
import { Environment } from '#/interfaces/environment'

describe('AccountService', () => {
	pinRevision(Application.ACCOUNT)

	test.each(Object.values(Environment))('synthesizes the manifests of %s', (environment) => {
		const app = new App()
		accountService.generate(environment, { scope: app })
		expect(app.synthYaml()).toMatchSnapshot()
	})
})
