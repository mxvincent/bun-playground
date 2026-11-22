import { describe, expect, test } from 'bun:test'
import {
	checkBody,
	checkChangesets,
	checkLabels,
	checkPullRequest,
	checkTitle,
	NO_CHANGESET_LABEL,
	type PullRequest,
	parseChangesetPackages,
	RELEASE_AUTHOR,
	type Workspace
} from './check-pull-request'

const WORKSPACES: Workspace[] = [
	{ directory: 'packages/core', name: '@package/core', versioned: true },
	{ directory: 'packages/drizzle', name: '@package/drizzle', versioned: true },
	{ directory: 'packages/kubernetes', name: '@package/kubernetes', versioned: true },
	{ directory: 'applications/account', name: '@application/account', versioned: true },
	{ directory: 'kubernetes', name: 'kubernetes', versioned: false }
]

const createPullRequest = (overrides: Partial<PullRequest> = {}): PullRequest => ({
	title: 'fix(core): reject expired tokens',
	body: 'Closes #42\n\nThe token expiry was ignored.',
	labels: ['bug', 'pkg/core'],
	author: 'mxvincent',
	changedFiles: ['packages/core/src/auth/jwt.ts', '.changeset/expired-tokens.md'],
	changesetPackages: ['@package/core'],
	workspaces: WORKSPACES,
	...overrides
})

describe('checkPullRequest()', () => {
	test('accepts a pull request that follows every convention', () => {
		expect(checkPullRequest(createPullRequest())).toEqual([])
	})

	test('skips the automated release pull request', () => {
		const pullRequest = createPullRequest({ title: 'release(main): 2026-11-22T14:23:55Z', body: '', labels: [] })
		expect(checkPullRequest({ ...pullRequest, author: RELEASE_AUTHOR })).toEqual([])
	})

	test('reports the violations of every check together', () => {
		const pullRequest = createPullRequest({ title: 'Fix stuff', body: '', labels: [], changesetPackages: [] })
		expect(checkPullRequest(pullRequest)).toHaveLength(5)
	})
})

describe('checkTitle()', () => {
	test('accepts code with upper case letters in the subject', () => {
		expect(checkTitle(createPullRequest({ title: 'fix(core): accept `JWT` tokens' }))).toEqual([])
	})

	test.each<{ title: string; error: string }>([
		{ title: 'reject expired tokens', error: 'The title must follow' },
		{ title: 'build(core): reject expired tokens', error: 'The type `build` is not allowed' },
		{ title: 'release(core): reject expired tokens', error: 'The `release` type is reserved' },
		{ title: 'fix(core)!: reject expired tokens', error: 'with a `BREAKING CHANGE:` footer' },
		{ title: 'fix(@package/core): reject expired tokens', error: 'must be a `kebab-case` workspace directory' },
		{ title: 'fix(core): ', error: 'The subject must not be empty' },
		{ title: 'fix(core): Reject expired tokens', error: 'must start with a lower case letter' },
		{ title: 'fix(core): reject expired tokens.', error: 'must not end with a period' },
		{ title: `fix(core): ${'a'.repeat(72)}`, error: 'must be under 72 characters (it has 72)' }
	])('rejects `$title`', ({ title, error }) => {
		expect(checkTitle(createPullRequest({ title }))).toEqual([expect.stringContaining(error)])
	})

	describe('scope', () => {
		test.each<{ title: string; changedFiles: string[]; description: string }>([
			{
				description: 'the directory of the only changed workspace, besides changesets',
				title: 'fix(core): reject expired tokens',
				changedFiles: ['packages/core/src/a.ts', '.changeset/a.md']
			},
			{
				description: 'no scope when several workspaces change',
				title: 'fix: reject expired tokens',
				changedFiles: ['packages/core/src/a.ts', 'packages/drizzle/src/b.ts']
			},
			{
				description: 'one scope for two workspaces with the same directory name',
				title: 'fix(kubernetes): pull images with the registry credentials',
				changedFiles: ['kubernetes/src/a.ts', 'packages/kubernetes/components/b.ts']
			},
			{
				description: 'no scope on a root change',
				title: 'docs: restrict the commit types',
				changedFiles: ['docs/conventions/naming.md']
			},
			{
				description: 'a subsystem scope on a root change',
				title: 'fix(changeset): version the private packages',
				changedFiles: ['scripts/changeset-version.sh', 'packages/core/package.json']
			}
		])('accepts $description', ({ title, changedFiles }) => {
			expect(checkTitle(createPullRequest({ title, changedFiles }))).toEqual([])
		})

		test.each<{ title: string; changedFiles: string[]; error: string; description: string }>([
			{
				description: 'another workspace than the only changed one',
				title: 'fix(drizzle): reject expired tokens',
				changedFiles: ['packages/core/src/a.ts'],
				error: 'The scope must be `core`'
			},
			{
				description: 'no scope when one workspace changes',
				title: 'fix: reject expired tokens',
				changedFiles: ['packages/core/src/a.ts'],
				error: 'The scope must be `core`'
			},
			{
				description: 'a scope when several workspaces change',
				title: 'fix(core): reject expired tokens',
				changedFiles: ['packages/core/src/a.ts', 'packages/drizzle/src/b.ts'],
				error: 'several workspaces (core, drizzle)'
			}
		])('rejects $description', ({ title, changedFiles, error }) => {
			expect(checkTitle(createPullRequest({ title, changedFiles }))).toEqual([expect.stringContaining(error)])
		})
	})
})

describe('checkBody()', () => {
	test.each<{ body: string; valid: boolean; description: string }>([
		{ body: 'Closes #42', valid: true, description: 'accepts a body made of the issue link' },
		{ body: '\nCloses #42\n\nPart of #40', valid: true, description: 'ignores leading blank lines' },
		{ body: '## Summary\n\nCloses #42', valid: false, description: 'rejects an issue link after other text' },
		{ body: 'Part of #42', valid: false, description: 'rejects a link that does not close the issue' },
		{ body: 'Closes #42 and #43', valid: false, description: 'rejects text after the issue link' },
		{ body: '', valid: false, description: 'rejects an empty body' }
	])('$description', ({ body, valid }) => {
		expect(checkBody(createPullRequest({ body }))).toHaveLength(valid ? 0 : 1)
	})
})

describe('checkLabels()', () => {
	test('requires a kind label', () => {
		expect(checkLabels(createPullRequest({ labels: ['pkg/core'] }))).toEqual([
			expect.stringContaining('must carry a kind label')
		])
	})

	test('requires the label of every changed package', () => {
		const changedFiles = ['packages/core/src/a.ts', 'packages/drizzle/src/b.ts']
		expect(checkLabels(createPullRequest({ changedFiles }))).toEqual([
			expect.stringContaining('must carry the `pkg/drizzle` label')
		])
	})

	test('does not require a label for an application or the kubernetes workspace', () => {
		const changedFiles = ['applications/account/src/a.ts', 'kubernetes/src/b.ts']
		expect(checkLabels(createPullRequest({ labels: ['bug'], changedFiles }))).toEqual([])
	})
})

describe('checkChangesets()', () => {
	test.each<{ changedFiles: string[]; description: string }>([
		{ changedFiles: ['packages/core/src/a.test.ts'], description: 'a test' },
		{ changedFiles: ['packages/drizzle/test-helpers/database.ts'], description: 'a test helper' },
		{ changedFiles: ['packages/kubernetes/components/__snapshots__/a.snap'], description: 'a snapshot' },
		{ changedFiles: ['packages/core/README.md'], description: 'documentation' },
		{ changedFiles: ['kubernetes/src/charts/account.ts'], description: 'an unversioned workspace' },
		{ changedFiles: ['.github/workflows/pull-request.yml', 'docs/a.md'], description: 'the repository root' }
	])('does not require a changeset for $description', ({ changedFiles }) => {
		expect(checkChangesets(createPullRequest({ changedFiles, changesetPackages: [] }))).toEqual([])
	})

	test('does not require a changeset with the no-changeset label', () => {
		const pullRequest = createPullRequest({ labels: ['bug', 'pkg/core', NO_CHANGESET_LABEL], changesetPackages: [] })
		expect(checkChangesets(pullRequest)).toEqual([])
	})

	test('requires a changeset for every changed versioned workspace', () => {
		const changedFiles = ['packages/core/src/a.ts', 'packages/kubernetes/package.json', 'applications/account/src/b.ts']
		expect(checkChangesets(createPullRequest({ changedFiles, changesetPackages: ['@package/core'] }))).toEqual([
			expect.stringContaining('`@package/kubernetes`'),
			expect.stringContaining('`@application/account`')
		])
	})
})

describe('parseChangesetPackages()', () => {
	test('reads every package of the frontmatter, quoted or not', () => {
		const content = `---\n"@package/core": minor\n'@package/drizzle': patch\nkubernetes: major\n---\n\nSummary: with a colon.\n`
		expect(parseChangesetPackages(content)).toEqual(['@package/core', '@package/drizzle', 'kubernetes'])
	})

	test('reads nothing from an empty changeset', () => {
		expect(parseChangesetPackages('---\n---\n\nNothing to release.\n')).toEqual([])
	})
})
