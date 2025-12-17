import { getInput } from '@actions/core'
import * as fs from 'node:fs'

export const listApplications = (): string[] => {
	const applicationsDir = getInput('applications-directory', { required: true })
	const applications: string[] = []
	for (const application of fs.readdirSync(applicationsDir)) {
		const packageJson = JSON.parse(fs.readFileSync(`${applicationsDir}/${application}/package.json`, 'utf-8'))
		if ('name' in packageJson && typeof packageJson.name === 'string') {
			applications.push(packageJson.name)
		}
	}
	return applications
}

export const getPublishedPackages = (): { name: string; version: string }[] => {
	return JSON.parse(getInput('published-packages', { required: true }))
}
