import * as fs from 'node:fs'
import { getInput } from '@actions/core'

export interface Application {
	/** Package name, as changesets reports it when the application is published */
	name: string
	/** Workspace directory under `applications/`, passed to the dockerfile as `APP_NAME` */
	directory: string
	/** Image name under the registry owner, from the `image` field of the application `package.json` */
	image?: string
}

export const listApplications = (): Application[] => {
	const applicationsDir = getInput('applications-directory', { required: true })
	const applications: Application[] = []
	for (const directory of fs.readdirSync(applicationsDir)) {
		const packageJson = JSON.parse(fs.readFileSync(`${applicationsDir}/${directory}/package.json`, 'utf-8'))
		if ('name' in packageJson && typeof packageJson.name === 'string') {
			const image = typeof packageJson.image === 'string' ? packageJson.image : undefined
			applications.push({ name: packageJson.name, directory, image })
		}
	}
	return applications
}

export const getPublishedPackages = (): { name: string; version: string }[] => {
	return JSON.parse(getInput('published-packages', { required: true }))
}
