/**
 * Checks a pull request against the MUST rules of `docs/conventions/commits-and-branches.md` and
 * `docs/conventions/versioning.md` that a tool can check: title, body, labels and changesets.
 *
 * Run by `.github/workflows/pull-request-conventions.yml`. Reads the pull request from the
 * environment and the changed files from git, prints one GitHub error annotation per violation,
 * and exits with code 1 when there is at least one.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export type Workspace = {
	directory: string
	name: string
	versioned: boolean
}

export type PullRequest = {
	title: string
	body: string
	labels: string[]
	author: string
	changedFiles: string[]
	changesetPackages: string[]
	workspaces: Workspace[]
}

export const COMMIT_TYPES = ['feat', 'fix', 'refactor', 'perf', 'test', 'docs', 'style', 'ci', 'chore']
export const KIND_LABELS = ['bug', 'test', 'performance', 'refactor', 'documentation', 'enhancement']
export const NO_CHANGESET_LABEL = 'no-changeset'
export const RELEASE_AUTHOR = 'github-actions[bot]'
export const SUBJECT_MAX_LENGTH = 72

const HEADER = /^(?<type>[a-z]+)(?:\((?<scope>[^)]*)\))?(?<breaking>!)?: (?<subject>.*)$/
const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ISSUE_LINK = /^Closes #\d+\s*$/
const NOT_CONSUMER_VISIBLE = [/\.test\.ts$/, /(^|\/)test-helpers\//, /(^|\/)__snapshots__\//, /\.md$/]

const lastSegment = (path: string): string => path.split('/').at(-1) ?? path

const findWorkspace = (file: string, workspaces: Workspace[]): Workspace | undefined =>
	workspaces.find((workspace) => file.startsWith(`${workspace.directory}/`))

const changedWorkspaces = (pullRequest: PullRequest): Workspace[] => {
	const changed = new Set<Workspace>()
	for (const file of pullRequest.changedFiles) {
		const workspace = findWorkspace(file, pullRequest.workspaces)
		if (workspace) {
			changed.add(workspace)
		}
	}
	return [...changed]
}

const touchesRepositoryRoot = (pullRequest: PullRequest): boolean =>
	pullRequest.changedFiles.some(
		(file) => !file.startsWith('.changeset/') && !findWorkspace(file, pullRequest.workspaces)
	)

export const isReleasePullRequest = (pullRequest: PullRequest): boolean =>
	pullRequest.author === RELEASE_AUTHOR && pullRequest.title.startsWith('release(')

export const checkTitle = (pullRequest: PullRequest): string[] => {
	const header = HEADER.exec(pullRequest.title)?.groups
	if (!header) {
		return ['The title must follow `<type>(<scope>): <subject>`, or `<type>: <subject>` without a scope.']
	}
	const { type = '', scope, breaking, subject = '' } = header
	const errors: string[] = []

	if (type === 'release') {
		errors.push('The `release` type is reserved for the automated release pull request.')
	} else if (!COMMIT_TYPES.includes(type)) {
		errors.push(`The type \`${type}\` is not allowed. Use one of: ${COMMIT_TYPES.join(', ')}.`)
	}
	if (breaking) {
		errors.push('A breaking change is declared with a `BREAKING CHANGE:` footer in the body, not with `!`.')
	}
	errors.push(...checkScope(pullRequest, scope))
	if (subject.length === 0) {
		errors.push('The subject must not be empty.')
	}
	if (/^[A-Z]/.test(subject)) {
		errors.push('The subject must start with a lower case letter.')
	}
	if (subject.endsWith('.')) {
		errors.push('The subject must not end with a period.')
	}
	if (subject.length >= SUBJECT_MAX_LENGTH) {
		errors.push(`The subject must be under ${SUBJECT_MAX_LENGTH} characters (it has ${subject.length}).`)
	}
	return errors
}

const checkScope = (pullRequest: PullRequest, scope: string | undefined): string[] => {
	if (scope !== undefined && !KEBAB_CASE.test(scope)) {
		return [`The scope \`${scope}\` must be a \`kebab-case\` workspace directory name.`]
	}
	// A change that touches the repository root MAY use a subsystem name as scope, or none.
	if (touchesRepositoryRoot(pullRequest)) {
		return []
	}
	const directories = [...new Set(changedWorkspaces(pullRequest).map((workspace) => lastSegment(workspace.directory)))]
	const [directory] = directories
	if (directories.length === 1 && scope !== directory) {
		return [`The scope must be \`${directory}\`, the only workspace this pull request changes.`]
	}
	if (directories.length > 1 && scope !== undefined) {
		return [`The scope must be omitted: this pull request changes several workspaces (${directories.join(', ')}).`]
	}
	return []
}

export const checkBody = (pullRequest: PullRequest): string[] => {
	const [firstLine = ''] = pullRequest.body.trimStart().split('\n')
	return ISSUE_LINK.test(firstLine) ? [] : ['The body must start with `Closes #<issue>` on its own line.']
}

export const checkLabels = (pullRequest: PullRequest): string[] => {
	const errors: string[] = []
	if (!pullRequest.labels.some((label) => KIND_LABELS.includes(label))) {
		errors.push(`The pull request must carry a kind label: ${KIND_LABELS.join(', ')}.`)
	}
	for (const workspace of changedWorkspaces(pullRequest)) {
		const label = `pkg/${lastSegment(workspace.directory)}`
		if (workspace.directory.startsWith('packages/') && !pullRequest.labels.includes(label)) {
			errors.push(`The pull request changes \`${workspace.name}\` and must carry the \`${label}\` label.`)
		}
	}
	return errors
}

export const checkChangesets = (pullRequest: PullRequest): string[] => {
	if (pullRequest.labels.includes(NO_CHANGESET_LABEL)) {
		return []
	}
	const needingChangeset = new Set<string>()
	for (const file of pullRequest.changedFiles) {
		const workspace = findWorkspace(file, pullRequest.workspaces)
		if (workspace?.versioned && !NOT_CONSUMER_VISIBLE.some((pattern) => pattern.test(file))) {
			needingChangeset.add(workspace.name)
		}
	}
	return [...needingChangeset]
		.filter((name) => !pullRequest.changesetPackages.includes(name))
		.map(
			(name) =>
				`\`${name}\` changes outside its tests and documentation: add a changeset (\`bunx changeset\`), or the \`${NO_CHANGESET_LABEL}\` label if no consumer sees the change.`
		)
}

export const checkPullRequest = (pullRequest: PullRequest): string[] => {
	if (isReleasePullRequest(pullRequest)) {
		return []
	}
	return [
		...checkTitle(pullRequest),
		...checkBody(pullRequest),
		...checkLabels(pullRequest),
		...checkChangesets(pullRequest)
	]
}

const git = (...parameters: string[]): string[] =>
	Bun.spawnSync(['git', ...parameters], { stderr: 'inherit' })
		.stdout.toString()
		.split('\n')
		.filter((line) => line.length > 0)

const readWorkspaces = (root: string): Workspace[] => {
	const { workspaces } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { workspaces: string[] }
	const { ignore = [] } = JSON.parse(readFileSync(join(root, '.changeset/config.json'), 'utf8')) as {
		ignore?: string[]
	}
	return workspaces.flatMap((pattern) =>
		[...new Bun.Glob(`${pattern}/package.json`).scanSync({ cwd: root })].map((manifest) => {
			const directory = manifest.replace(/\/package\.json$/, '')
			const { name } = JSON.parse(readFileSync(join(root, manifest), 'utf8')) as { name: string }
			return { directory, name, versioned: !ignore.includes(name) }
		})
	)
}

export const parseChangesetPackages = (content: string): string[] => {
	const frontmatter = /^---\n(?<entries>[\s\S]*?)\n---/.exec(content)?.groups?.entries ?? ''
	return frontmatter
		.split('\n')
		.map((line) => /^["']?(?<name>[^"':]+)["']?\s*:\s*(major|minor|patch)\s*$/.exec(line.trim())?.groups?.name)
		.filter((name): name is string => name !== undefined)
}

const readEnvironment = (name: string): string => {
	const value = process.env[name]
	if (value === undefined) {
		console.log(`::error::Missing environment variable ${name}.`)
		process.exit(1)
	}
	return value
}

if (import.meta.main) {
	const root = process.cwd()
	const range = `${readEnvironment('BASE_SHA')}...${readEnvironment('HEAD_SHA')}`
	const changesetFiles = git('diff', '--name-only', '--diff-filter=AM', range, '--', '.changeset/*.md').filter(
		(file) => file !== '.changeset/README.md'
	)
	const errors = checkPullRequest({
		title: readEnvironment('PR_TITLE'),
		body: process.env.PR_BODY ?? '',
		labels: JSON.parse(readEnvironment('PR_LABELS')) as string[],
		author: readEnvironment('PR_AUTHOR'),
		changedFiles: git('diff', '--name-only', range),
		changesetPackages: changesetFiles.flatMap((file) => parseChangesetPackages(readFileSync(join(root, file), 'utf8'))),
		workspaces: readWorkspaces(root)
	})
	for (const error of errors) {
		console.log(`::error::${error}`)
	}
	if (errors.length > 0) {
		console.log('See docs/conventions/commits-and-branches.md and docs/conventions/versioning.md.')
		process.exit(1)
	}
	console.log('The pull request follows the conventions.')
}
