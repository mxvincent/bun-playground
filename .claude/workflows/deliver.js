export const meta = {
	name: 'deliver',
	description: 'Take a need from its issues to the merge: plan, then implement, open the pull requests and run review-stack',
	whenToUse:
		'Two runs. Plan: { need: string } creates the issues and returns the plan for the author to validate. Deliver: { stacks: number[][] (issue numbers, bottom to top, one array per stack or independent pull request), merge?: boolean (default true) }',
	phases: [
		{ title: 'Plan', detail: 'search the issues, create the issue or the parent issue and its sub-issues, group them into stacks' },
		{ title: 'Implement', detail: 'one agent per layer, bottom to top; independent stacks in parallel' },
		{ title: 'Submit', detail: 'open the pull requests of each stack, with assignee and labels' },
		{ title: 'Review', detail: 'review-stack on each stack, up to the merge' },
	],
}

const PLAN = {
	type: 'object',
	properties: {
		parentIssue: { type: ['integer', 'null'], description: 'The parent issue when the need takes several pull requests' },
		stacks: {
			type: 'array',
			description:
				'One entry per stack. Layers that depend on each other or touch the same files are one stack, bottom to top; an independent pull request is a stack of one layer.',
			items: {
				type: 'object',
				properties: {
					layers: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								issue: { type: 'integer' },
								title: { type: 'string' },
								scope: { type: 'string', description: 'What the pull request changes, and in which workspaces' },
							},
							required: ['issue', 'title', 'scope'],
						},
					},
				},
				required: ['layers'],
			},
		},
		questions: {
			type: 'array',
			items: { type: 'string' },
			description: 'Product decisions the author must take before the implementation',
		},
	},
	required: ['parentIssue', 'stacks', 'questions'],
}
const IMPLEMENTED = {
	type: 'object',
	properties: {
		branch: { type: 'string' },
		worktree: { type: 'string', description: 'Absolute path of the worktree the agent worked in' },
		problem: { type: 'string', description: 'Empty when the branch is pushed and green' },
	},
	required: ['branch', 'worktree', 'problem'],
}
const SUBMITTED = {
	type: 'object',
	properties: {
		prs: { type: 'array', items: { type: 'integer' }, description: 'Pull request numbers, bottom to top' },
		problem: { type: 'string', description: 'Empty when every pull request is open, assigned and labeled' },
	},
	required: ['prs', 'problem'],
}

// --- Plan: the first run stops here, for the author to validate the plan.

if (!args?.stacks) {
	if (!args?.need) return { problem: 'Pass { need } to plan, or { stacks } to deliver a validated plan' }
	phase('Plan')
	const plan = await agent(
		`Turn this need into GitHub issues, following the "Issues" and "Labels" sections of \
docs/conventions/commits-and-branches.md:\n\n${args.need}\n
Search the existing issues first (\`gh issue list --state all --search ...\`) and reuse an open issue that documents the need. \
When the need fits one pull request, use one issue. Otherwise create a parent issue that documents the whole need, and one \
sub-issue per pull request (\`gh issue create --parent <n>\`), each sized for one pull request. Every issue is in English, assigned \
to \`@me\`, with its kind and \`pkg/\` labels. Then group the sub-issues into stacks: layers that depend on each other or touch the \
same files form one stack, foundational work at the bottom; an independent pull request is a stack of its own. Do not write code \
and do not create branches. List in questions the product decisions the author must take; do not take them yourself.`,
		{ phase: 'Plan', label: 'plan', schema: PLAN },
	)
	if (!plan) return { problem: 'The plan agent did not return' }
	return {
		plan,
		next: `Validate the plan, then run deliver with { stacks: ${JSON.stringify(plan.stacks.map((s) => s.layers.map((l) => l.issue)))} }`,
	}
}

// --- Deliver: a validated plan, one array of issue numbers per stack, bottom to top.

const MERGE = args.merge !== false
const stacks = args.stacks
log(`Delivering ${stacks.map((s) => s.map((n) => `#${n}`).join(' <- ')).join(', ')}`)

async function implementStack(issues, index) {
	const layers = []
	let base = 'main'
	for (const issue of issues) {
		const done = await agent(
			`Implement issue #${issue} (\`gh issue view ${issue} --comments\`), and only it. In this worktree: \`git fetch origin && \
git switch -c ${issue}-<slug> origin/${base}\`, where the slug is a short kebab-case summary of the issue title. Follow the \
conventions of docs/conventions/ that govern the files you touch; write the tests that testing.md asks for, and a changeset when \
versioning.md asks for one. Before committing, the type-check and the tests of the workspaces you touched and \`bunx biome check \
--write .\` must pass. Make one commit whose message follows "Commit messages" and carries \`Closes #${issue}\`, then \`git push -u \
origin <branch>\` and \`git switch --detach\`, so that the branch is free for the other steps. Do not open a pull request. When the \
issue needs a product decision you cannot take, stop and set problem.`,
			{ phase: 'Implement', label: `implement:#${issue}`, schema: IMPLEMENTED, isolation: 'worktree' },
		)
		if (!done || done.problem) return { error: `#${issue}: ${done?.problem || 'the implementation agent did not return'}`, layers }
		layers.push({ issue, ...done })
		base = done.branch
	}
	log(`Stack ${index + 1}: ${layers.map((l) => l.branch).join(' <- ')} pushed`)
	return { layers }
}

function submit(layers) {
	const stacked = layers.length > 1
	return agent(
		`Open the pull requests of these pushed branches, bottom to top, following the "Pull requests" section of \
docs/conventions/commits-and-branches.md:\n${JSON.stringify(layers.map(({ issue, branch }) => ({ issue, branch })), null, 2)}\n
Work only in this worktree. ${
			stacked
				? '`gh stack init <branches, bottom to top>` adopts the branches, then `gh stack submit --auto --open`.'
				: '`gh pr create --fill-first --base main --head <branch>`.'
		} On each pull request: assign \`@me\`, add the labels of its issue, and check that the body starts with \`Closes #<issue>\` and \
explains why, ending with "🤖 Generated with [Claude Code](https://claude.com/claude-code)". Then remove the worktrees the \
implementation agents left (${layers.map((l) => l.worktree).join(', ')}) with \`git worktree remove\`, only when clean.`,
		{ phase: 'Submit', label: `submit:${layers[0].branch}`, schema: SUBMITTED, isolation: 'worktree' },
	)
}

// A stage that fails returns { error }, and the later stages pass it through, so that the result says where each stack stopped.
const results = await pipeline(
	stacks,
	(issues, _, index) => implementStack(issues, index),
	async ({ error, layers }) => {
		if (error) return { error }
		const submitted = await submit(layers)
		if (!submitted || submitted.problem) return { error: submitted?.problem || 'the submit agent did not return' }
		return { prs: submitted.prs }
	},
	async ({ error, prs }) => {
		if (error) return { merged: false, handBack: [error] }
		return (await workflow('review-stack', { prs, merge: MERGE })) || { merged: false, handBack: ['review-stack did not return'] }
	},
)

return stacks.map((issues, i) => ({ issues, result: results[i] }))
