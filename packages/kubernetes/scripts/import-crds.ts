/**
 * Regenerates the `crds/` classes used by this package. Bump a version here and run the script to update them.
 */
import { join } from 'node:path'
import { importCrds } from '../helpers/crds'

await importCrds({
	output: join(import.meta.dir, '..', 'crds'),
	sources: {
		'external-secrets.io': [
			'https://raw.githubusercontent.com/external-secrets/external-secrets/v2.14.0/deploy/crds/bundle.yaml'
		]
	}
})
