import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getRepositoryRootDirectory } from '#/helpers/misc'
import { Application } from '#interfaces/application'
import type { Environment } from '#interfaces/environment'

/**
 * You can use this map to pin a specific version
 */
export const revisions = new Map<Application, string | Map<Environment, string>>()

const paths = new Map<Application, string>()
paths.set(Application.ACCOUNT, 'applications/account')

const getPackageJsonPath = (application: Application): string => {
	const appDirectory = paths.get(application) ?? `applications/${application}`
	return join(getRepositoryRootDirectory(__filename), appDirectory, 'package.json')
}

/**
 * Get the last release number from application `package.json`
 */
const readPackageVersion = (application: Application): string => {
	const packageJsonPath = getPackageJsonPath(application)
	const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
	if (packageJson?.version) {
		return packageJson.version
	}
	throw new Error(`Failed to load revision from ${packageJsonPath}`)
}

/**
 * Get target revision for an application
 */
export const getRevision = (application: Application, environment: Environment): string => {
	const revision = revisions.get(application)
	if (typeof revision === 'string') {
		return revision
	}
	return revision?.get(environment) ?? readPackageVersion(application)
}
