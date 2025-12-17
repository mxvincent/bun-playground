import { context, getOctokit } from '@actions/github'
import { getPublishedPackages, listApplications } from './context'

const token = process.env.GITHUB_TOKEN
if (!token) {
	throw new Error('GITHUB_TOKEN is required')
}

const octokit = getOctokit(token)

const applications = listApplications()
const isApplication = (pkg: { name: string }) => applications.find((appName) => appName === pkg.name)

for (const pkg of getPublishedPackages().filter(isApplication)) {
	const inputs = {
		application: pkg.name,
		image: `ghcr.io/mxvincent/${pkg.name}`,
		version: pkg.version
	}
	octokit.rest.actions.createWorkflowDispatch({
		owner: context.repo.owner,
		repo: context.repo.repo,
		workflow_id: 'docker-build.yaml',
		ref: context.ref,
		inputs
	})
	console.log('dispatch docker-build workflow', inputs)
}
