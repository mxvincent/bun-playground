import { context, getOctokit } from '@actions/github'
import { getPublishedPackages, listApplications } from './context'

const REGISTRY = 'ghcr.io/mxvincent'

const main = async () => {
	const token = process.env.GITHUB_TOKEN
	if (!token) {
		throw new Error('GITHUB_TOKEN is required')
	}

	const octokit = getOctokit(token)
	const applications = listApplications()

	for (const pkg of getPublishedPackages()) {
		const application = applications.find(({ name }) => name === pkg.name)
		if (!application) {
			continue
		}
		if (!application.image) {
			throw new Error(`applications/${application.directory}/package.json must declare its image name ("image" field)`)
		}
		const inputs = {
			application: application.directory,
			image: `${REGISTRY}/${application.image}`,
			version: pkg.version
		}
		await octokit.rest.actions.createWorkflowDispatch({
			owner: context.repo.owner,
			repo: context.repo.repo,
			workflow_id: 'docker-build.yaml',
			ref: context.ref,
			inputs
		})
		console.log('dispatch docker-build workflow', inputs)
	}
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})
