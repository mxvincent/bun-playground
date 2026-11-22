#!/usr/bin/env bun
/**
 * PreToolUse hook on Bash: before the first git or GitHub workflow command of a session (issue, branch,
 * commit, push, pull request, stack), deny the command once and hand Claude the content of
 * `docs/conventions/commits-and-branches.md`. The retry passes: the conventions are now in context.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

type HookInput = {
	session_id: string
	cwd: string
	tool_name: string
	tool_input: { command?: string }
}

const WORKFLOW_COMMAND =
	/\b(git\s+(commit|push|switch\s+-c|checkout\s+-b)|gh\s+(issue\s+create|pr\s+(create|edit|merge)|stack))\b/

const input = (await Bun.stdin.json()) as HookInput
const command = input.tool_input.command ?? ''

if (input.tool_name !== 'Bash' || !WORKFLOW_COMMAND.test(command)) {
	process.exit(0)
}

const markerDirectory = join(tmpdir(), 'claude-commit-conventions')
const marker = join(markerDirectory, input.session_id)
if (existsSync(marker)) {
	process.exit(0)
}

const projectDirectory = process.env.CLAUDE_PROJECT_DIR ?? input.cwd
const conventions = readFileSync(join(projectDirectory, 'docs/conventions/commits-and-branches.md'), 'utf8')

mkdirSync(markerDirectory, { recursive: true })
writeFileSync(marker, '')

console.log(
	JSON.stringify({
		hookSpecificOutput: {
			hookEventName: 'PreToolUse',
			permissionDecision: 'deny',
			permissionDecisionReason: [
				'This command was held once so that you read the repository conventions for issues, branches,',
				'commits and pull requests first. Check the command against them, fix it if needed, then run it',
				'again: it will not be held a second time in this session.',
				'',
				conventions
			].join('\n')
		}
	})
)
