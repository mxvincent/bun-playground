export const meta = {
	name: 'review-stack',
	description:
		'Run the review rounds of docs/conventions/code-review.md on a pull request or a stack, from the review to the merge',
	whenToUse:
		'A pull request or a stack is ready for review. Args: { prs?: number[] (bottom to top, defaults to the checked out stack or pull request), merge?: boolean (default true) }',
	phases: [
		{ title: 'Discover', detail: 'pull requests, branches and bases, bottom to top' },
		{ title: 'Review', detail: 'two independent reviewers per pull request, then a merge of their findings' },
		{ title: 'Verify', detail: 'three skeptics per finding, two more on a two out of three vote' },
		{ title: 'Publish', detail: 'one GitHub review per pull request' },
		{ title: 'Fix', detail: 'one agent per pull request, each in its own worktree' },
		{ title: 'Apply', detail: 'fix commits applied bottom to top, then pushed' },
		{ title: 'Re-review', detail: 'the fix commits of every layer at once' },
		{ title: 'Merge', detail: 'rebase, green checks, then the merge of the stack' },
	],
}

const MAX_ROUNDS = 3
const MERGE = args?.merge !== false

const SEVERITY = { type: 'string', enum: ['blocker', 'suggestion', 'question'] }
const FINDING = {
	type: 'object',
	properties: {
		file: { type: 'string', description: 'Path from the repository root' },
		line: { type: 'integer', description: 'Line of the file at the head of the pull request, inside a hunk of its diff' },
		severity: SEVERITY,
		pass: { type: 'string', enum: ['structure', 'bugs', 'performance', 'readability', 'conventions'] },
		title: { type: 'string', description: 'One line' },
		body: {
			type: 'string',
			description: 'The comment to post, in English, starting with the severity prefix, with the concrete case',
		},
	},
	required: ['file', 'line', 'severity', 'pass', 'title', 'body'],
}
const FINDINGS = {
	type: 'object',
	properties: { findings: { type: 'array', items: FINDING } },
	required: ['findings'],
}
const STACK = {
	type: 'object',
	properties: {
		isStack: { type: 'boolean' },
		problem: { type: 'string', description: 'Empty when the flow can start' },
		prs: {
			type: 'array',
			description: 'Bottom to top',
			items: {
				type: 'object',
				properties: {
					number: { type: 'integer' },
					branch: { type: 'string' },
					base: { type: 'string' },
				},
				required: ['number', 'branch', 'base'],
			},
		},
	},
	required: ['isStack', 'problem', 'prs'],
}
const VERDICT = {
	type: 'object',
	properties: {
		confirmed: { type: 'boolean' },
		reason: { type: 'string', description: 'The input or state you checked, and what the code actually does' },
	},
	required: ['confirmed', 'reason'],
}
const PUBLISHED = {
	type: 'object',
	properties: { reviewUrl: { type: 'string' }, comments: { type: 'integer' } },
	required: ['reviewUrl', 'comments'],
}
const FIXED = {
	type: 'object',
	properties: {
		commit: { type: ['string', 'null'], description: 'SHA of the fix commit, null when nothing was committed' },
		replies: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					commentId: { type: 'integer' },
					action: { type: 'string', enum: ['fixed', 'declined', 'answered', 'needs_author'] },
					reply: { type: 'string', description: 'The reply to post, in English, without the commit SHA' },
				},
				required: ['commentId', 'action', 'reply'],
			},
		},
	},
	required: ['commit', 'replies'],
}
const APPLIED = {
	type: 'object',
	properties: {
		pushed: { type: 'boolean' },
		fixCommits: {
			type: 'array',
			description: 'The fix commit of each pull request after the rebase',
			items: {
				type: 'object',
				properties: { number: { type: 'integer' }, commit: { type: 'string' } },
				required: ['number', 'commit'],
			},
		},
		problem: { type: 'string', description: 'Empty when every commit was applied, pushed and replied to' },
	},
	required: ['pushed', 'fixCommits', 'problem'],
}
const REREVIEWED = {
	type: 'object',
	properties: {
		openThreads: { type: 'integer', description: 'Review threads still unresolved after this re-review' },
		findings: { type: 'array', items: FINDING, description: 'New findings introduced by the fix commit' },
	},
	required: ['openThreads', 'findings'],
}
const MERGED = {
	type: 'object',
	properties: { merged: { type: 'boolean' }, details: { type: 'string' } },
	required: ['merged', 'details'],
}

const range = (from, to) => Array.from({ length: to - from }, (_, i) => from + i)
const describe = (pr) => `pull request #${pr.number} (branch \`${pr.branch}\`, base \`${pr.base}\`)`
const READ_ONLY = `Do not change the working tree, do not check out a branch, and do not post anything on GitHub: \
read files with \`git show origin/<branch>:<path>\` after \`git fetch origin\`.`

// --- Discover

phase('Discover')
const stack = await agent(
	`Find the pull requests to review, bottom to top. ${
		args?.prs?.length
			? `They are ${args.prs.map((n) => `#${n}`).join(', ')}, in that order.`
			: 'Take the stack of the checked out branch (`gh stack view --json`), or its pull request when it is not in a stack.'
	} For each, give its number, head branch and base branch (\`gh pr view <n> --json number,headRefName,baseRefName,state\`). \
Set isStack when there are several pull requests or the branch is in a gh stack. Set problem when a pull request is not open, \
when the working tree is not clean (\`git status --porcelain\`), or when a base is neither \`main\`, nor the branch of \
the pull request below it, nor the head branch of an open pull request.`,
	{ phase: 'Discover', schema: STACK, effort: 'low' },
)
if (!stack || stack.problem || !stack.prs.length) {
	return { handBack: stack?.problem || 'No pull request found' }
}
const prs = stack.prs
log(`Reviewing ${prs.map((pr) => `#${pr.number}`).join(' <- ')}`)

// --- Steps

async function review(pr) {
	const reviews = await parallel(
		[1, 2].map((r) => () =>
			agent(
				`You are reviewer ${r} of 2 of ${describe(pr)}. Review its diff (\`gh pr diff ${pr.number}\`) through every pass of \
the "Passes" section of docs/conventions/code-review.md, reading the surrounding code where you need it. Report only findings that \
follow the "Comments" section: a line of the head of the pull request inside a hunk of the diff, a concrete case, a severity. \
Do not raise what CI checks. ${READ_ONLY}`,
				{ phase: 'Review', label: `review:#${pr.number}:${r}`, schema: FINDINGS },
			),
		),
	)
	const found = reviews.filter(Boolean).flatMap((r) => r.findings)
	if (reviews.filter(Boolean).length < 2) log(`#${pr.number}: a reviewer did not return; ${found.length} findings from one review`)
	if (found.length < 2) return found
	const merged = await agent(
		`Two reviewers reviewed ${describe(pr)} independently. Merge their findings: when two findings describe the same problem, \
keep one, the clearer, with the higher severity. Change nothing else.\n\n${JSON.stringify(found, null, 2)}`,
		{ phase: 'Review', label: `merge:#${pr.number}`, schema: FINDINGS, effort: 'low' },
	)
	return merged ? merged.findings : found
}

function skeptics(pr, finding, index, from, to) {
	return parallel(
		range(from, to).map((k) => () =>
			agent(
				`You are skeptic ${k + 1} on this finding of a review of ${describe(pr)}. Try to refute it against the code. \
Confirm it only when you can name the input or state that triggers it and check from the code that the stated result is the \
actual one. When unsure, do not confirm. Do not report other problems. ${READ_ONLY}\n\n${JSON.stringify(finding, null, 2)}`,
				{ phase: 'Verify', label: `skeptic:#${pr.number}:${index}:${k + 1}`, schema: VERDICT },
			),
		),
	)
}

// Three out of three keeps the finding, one or none drops it, two out of three calls two more skeptics:
// four or five out of five keep it. A skeptic that does not return counts as a refutation.
async function verify(pr, findings) {
	const kept = await parallel(
		findings.map((finding, index) => async () => {
			const confirmed = (votes) => votes.filter((v) => v?.confirmed).length
			const first = confirmed(await skeptics(pr, finding, index, 0, 3))
			if (first === 3) return finding
			if (first < 2) return null
			const total = first + confirmed(await skeptics(pr, finding, index, 3, 5))
			return total >= 4 ? finding : null
		}),
	)
	const result = kept.filter(Boolean)
	log(`#${pr.number}: ${result.length} of ${findings.length} findings kept`)
	return result
}

function publish(pr, findings, round) {
	return agent(
		`Post one review on ${describe(pr)} with these findings, one inline comment each, at their file and line, on the head \
commit (\`gh pr view ${pr.number} --json headRefOid\`). Use \`gh api repos/{owner}/{repo}/pulls/${pr.number}/reviews\` with \
\`event: COMMENT\`: GitHub does not let the author request changes on their own pull request. The review body says "Review round \
${round}" and counts the findings per severity. Post each comment body as given.\n\n${JSON.stringify(findings, null, 2)}`,
		{ phase: 'Publish', label: `publish:#${pr.number}`, schema: PUBLISHED, effort: 'low' },
	)
}

function fix(pr, round) {
	return agent(
		`You are the author of ${describe(pr)}. In this worktree, run \`git fetch origin && git switch -C ${pr.branch} \
origin/${pr.branch}\`. List the unresolved review threads of the pull request (GraphQL \`reviewThreads\`) and answer each one: \
fix a blocker; fix a suggestion or decline it with a reason; answer a question. Use needs_author only for a product decision you \
cannot take. Commit every fix of this round in one commit, \`fix: address review round ${round}\` (use the scope of the pull \
request title), after the type-check, the tests and \`bunx biome check --write\` pass on the workspaces you touched. Do not push \
and do not post the replies: return them.`,
		{ phase: 'Fix', label: `fix:#${pr.number}`, schema: FIXED, isolation: 'worktree' },
	)
}

function apply(fixes) {
	return agent(
		`Apply the fix commits of this review round, bottom to top, then push them and post the replies.\n
Pull requests, bottom to top, with their fix commit (created in other worktrees of this repository) and replies:
${JSON.stringify(fixes, null, 2)}\n
Record the current branch first and switch back to it at the end. For each pull request with a commit: \`git switch <branch>\`, \
\`git reset --hard origin/<branch>\`, \`git cherry-pick <commit>\`${
			stack.isStack ? ', then `gh stack rebase --upstack`' : ''
		}. Resolve a conflict only when it is mechanical; otherwise abort and set problem. Then ${
			stack.isStack ? '`gh stack push`' : '`git push --force-with-lease`'
		}. Find the SHA of each fix commit after the rebase, then reply to each comment \
(\`gh api repos/{owner}/{repo}/pulls/<n>/comments/<commentId>/replies\`): a fixed comment names its fix commit. Replies are in \
English.`,
		{ phase: 'Apply', label: 'apply', schema: APPLIED },
	)
}

function rereview(pr, commit) {
	return agent(
		`Re-review ${describe(pr)} after its review round. ${
			commit ? `Its fix commit is ${commit}: read it with \`git show ${commit}\`.` : 'No fix commit was made.'
		} For each unresolved review thread (GraphQL \`reviewThreads\`), check the reply: resolve the thread (\`resolveReviewThread\`) \
when the fix resolves the finding or the reason to decline holds; leave it open otherwise, with a reply that says why. Then read \
the fix commit through every pass of docs/conventions/code-review.md and report only the problems it introduces, as findings. \
Do not change files.`,
		{ phase: 'Re-review', label: `re-review:#${pr.number}`, schema: REREVIEWED },
	)
}

// --- Rounds

const handBack = []
let pending = new Map() // round 1 reviews the whole pull requests; later rounds verify the findings of the re-review
let openThreads = new Map() // unresolved threads per pull request after the last re-review
let clean = false

for (let round = 1; round <= MAX_ROUNDS && !clean; round++) {
	log(`Round ${round}`)
	const results = await pipeline(
		prs,
		async (pr) => (round === 1 ? review(pr) : pending.get(pr.number) || []),
		async (findings, pr) => (findings.length ? verify(pr, findings) : []),
		async (findings, pr) => {
			if (!findings.length) return { published: true, count: 0 }
			return { published: Boolean(await publish(pr, findings, round)), count: findings.length }
		},
		async (p, pr) => {
			if (!p.published) handBack.push(`#${pr.number}: the review of round ${round} was not published`)
			if (!p.count && !openThreads.get(pr.number)) return { commit: null, replies: [], idle: true }
			return (await fix(pr, round)) || { commit: null, replies: [], failed: true }
		},
	)

	const fixes = prs.map((pr, i) => ({ ...pr, commit: results[i]?.commit || null, replies: results[i]?.replies || [] }))
	for (const f of fixes) {
		for (const r of f.replies.filter((r) => r.action === 'needs_author')) {
			handBack.push(`#${f.number}, comment ${r.commentId}: ${r.reply}`)
		}
	}
	prs.forEach((pr, i) => {
		if (!results[i] || results[i].failed) handBack.push(`#${pr.number}: the fix agent of round ${round} did not return`)
	})
	if (handBack.length) break

	let commits = new Map()
	if (fixes.some((f) => f.commit || f.replies.length)) {
		const applied = await apply(fixes)
		if (!applied || applied.problem || !applied.pushed) {
			handBack.push(`Round ${round}: ${applied?.problem || 'the fix commits were not applied'}`)
			break
		}
		commits = new Map(applied.fixCommits.map((c) => [c.number, c.commit]))
	}

	const touched = prs.filter((pr, i) => !results[i].idle)
	const rereviews = await parallel(touched.map((pr) => () => rereview(pr, commits.get(pr.number))))
	pending = new Map(touched.map((pr, i) => [pr.number, rereviews[i]?.findings || []]))
	openThreads = new Map(touched.map((pr, i) => [pr.number, rereviews[i] ? rereviews[i].openThreads : 1]))
	const open = [...openThreads.values()].reduce((n, c) => n + c, 0)
	const fresh = [...pending.values()].reduce((n, f) => n + f.length, 0)
	log(`Round ${round}: ${open} open threads, ${fresh} new findings`)
	clean = open === 0 && fresh === 0
	if (!clean && round === MAX_ROUNDS) handBack.push(`A blocker or an open thread remains after round ${MAX_ROUNDS}`)
}

// --- Merge

if (!clean || handBack.length) return { merged: false, handBack }
if (!MERGE) return { merged: false, handBack: ['Every thread is resolved; merge skipped (merge: false)'] }

const merged = await agent(
	`Merge ${prs.map(describe).join(', ')}, following the "Merging" section of docs/conventions/commits-and-branches.md. \
Check first that no review thread is unresolved. ${
		stack.isStack
			? '`gh stack rebase && gh stack push`, wait for the checks of every pull request (`gh pr checks <n> --watch`), then `gh stack merge ' +
				prs[prs.length - 1].number +
				' --yes --squash`.'
			: '`git rebase origin/main && git push --force-with-lease`, wait for the checks (`gh pr checks <n> --watch`), then `gh pr merge <n> --squash`.'
	} Do not bypass a check or the ruleset. When a check fails, do not merge: report it.`,
	{ phase: 'Merge', label: 'merge', schema: MERGED },
)
return { merged: Boolean(merged?.merged), details: merged?.details, handBack: merged?.merged ? [] : [merged?.details || 'merge agent did not return'] }
