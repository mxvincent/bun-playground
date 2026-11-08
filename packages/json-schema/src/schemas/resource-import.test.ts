import { expect, test } from 'bun:test'

// Load the module in a fresh process: the module cache of the test run would hide an import cycle
test('schemas/resource.ts can be imported before the schema builder', () => {
	const { exitCode, stderr } = Bun.spawnSync([process.execPath, '-e', `await import('${import.meta.dir}/resource.ts')`])
	expect({ exitCode, stderr: stderr.toString() }).toStrictEqual({ exitCode: 0, stderr: '' })
})
