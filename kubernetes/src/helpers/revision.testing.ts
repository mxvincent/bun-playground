import { afterAll, beforeAll } from 'bun:test'
import { revisions } from '#/helpers/revision'
import type { Application } from '#/interfaces/application'

/**
 * Pin the revision of an application during the tests of the current suite, and restore the previous pin afterwards
 *
 * Releasing the application then does not change the snapshots.
 */
export const pinRevision = (application: Application, revision = '0.0.0-snapshot') => {
	const previous = revisions.get(application)
	beforeAll(() => {
		revisions.set(application, revision)
	})
	afterAll(() => {
		if (previous === undefined) {
			revisions.delete(application)
		} else {
			revisions.set(application, previous)
		}
	})
}
