import { readJsonFileSync } from './read-json-file'

export interface PackageInfo {
	name: string
	version: string
	description?: string
}

export type GetPackageInfoOptions = {
	packageJsonFilePath?: string
	defaultValues?: Partial<PackageInfo>
}

const buildResult = (values: Partial<PackageInfo>): PackageInfo => ({
	name: values.name ?? 'unknown',
	version: values.version ?? 'unknown',
	description: values.description
})

export const getPackageInfo = (options: GetPackageInfoOptions): PackageInfo => {
	try {
		const packageJson = readJsonFileSync<PackageInfo>(options.packageJsonFilePath ?? 'package.json')
		return buildResult(packageJson)
	} catch (error) {
		console.error(error)
		return buildResult(options.defaultValues ?? {})
	}
}
