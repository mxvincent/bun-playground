import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getRepositoryRootDirectory } from './misc'

/**
 * Revision of an application, or a function computing it for an environment
 */
export type RevisionSource = string | ((environment: string) => string)

/**
 * You can use this map to pin a specific version
 */
export const revisions = new Map<string, string | Map<string, string>>()

/**
 * Read the version of a package of the repository
 *
 * @param path directory of the package, relative to the repository root, e.g. `applications/account`
 */
export const packageVersion = (path: string): string => {
	const packageJsonPath = join(getRepositoryRootDirectory(process.cwd()), path, 'package.json')
	const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
	if (packageJson?.version) {
		return packageJson.version
	}
	throw new Error(`Failed to load revision from ${packageJsonPath}`)
}

/**
 * Get target revision for an application
 *
 * A pinned revision wins over the given source. Without a source, the revision is the version of
 * `applications/<application>/package.json`.
 */
export const getRevision = (application: string, environment: string, source?: RevisionSource): string => {
	const pinned = revisions.get(application)
	if (typeof pinned === 'string') {
		return pinned
	}
	const revision = pinned?.get(environment)
	if (revision) {
		return revision
	}
	if (typeof source === 'function') {
		return source(environment)
	}
	return source ?? packageVersion(`applications/${application}`)
}
