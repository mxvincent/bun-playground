import { expect, it } from 'bun:test'

const EXIT_TIMEOUT = 5000

/**
 * Start a fixture process and wait until it prints "ready"
 */
const startFixture = async (fixture: string, args: string[] = []) => {
	const child = Bun.spawn([process.execPath, `${import.meta.dir}/${fixture}`, ...args], {
		stdout: 'pipe',
		stderr: 'inherit'
	})
	const reader = child.stdout.getReader()
	let output = ''
	while (!output.includes('ready')) {
		const { value, done } = await reader.read()
		if (done) {
			break
		}
		output += new TextDecoder().decode(value)
	}
	return child
}

const waitForExit = (child: Bun.Subprocess) =>
	Promise.race([child.exited, Bun.sleep(EXIT_TIMEOUT).then(() => 'still running')])

it.each(['SIGINT', 'SIGTERM'] as const)(
	'flushes the pending spans then exits on %s',
	async (signal) => {
		const requestedPaths: string[] = []
		const server = Bun.serve({
			port: 0,
			fetch(request) {
				requestedPaths.push(new URL(request.url).pathname)
				return new Response(null, { status: 200 })
			}
		})
		const child = await startFixture('sdk.fixture.ts', [`http://127.0.0.1:${server.port}/v1/traces`])
		try {
			child.kill(signal)
			expect(await waitForExit(child)).toBe(0)
			expect(requestedPaths).toStrictEqual(['/v1/traces'])
		} finally {
			child.kill('SIGKILL')
			server.stop(true)
		}
	},
	EXIT_TIMEOUT * 2
)

it.each(['SIGINT', 'SIGTERM'] as const)(
	'keeps the default exit on %s when the SDK is not started',
	async (signal) => {
		const child = await startFixture('disabled.fixture.ts')
		try {
			child.kill(signal)
			await waitForExit(child)
			expect(child.signalCode).toBe(signal)
		} finally {
			child.kill('SIGKILL')
		}
	},
	EXIT_TIMEOUT * 2
)
