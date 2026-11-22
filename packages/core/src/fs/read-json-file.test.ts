import { expect, test } from 'bun:test'
import { resolve } from 'node:path'
import { FileNotReadableError } from '../errors/file-not-readable'
import { readJsonFileSync } from './read-json-file'

test('parses the file content', () => {
	const packageJson = readJsonFileSync<{ name: string }>(resolve(import.meta.dir, '../../package.json'))
	expect(packageJson.name).toBe('@package/core')
})

test('throws when the file does not exist', () => {
	expect(() => readJsonFileSync('/does-not-exist.json')).toThrow(
		expect.objectContaining({
			constructor: FileNotReadableError,
			path: '/does-not-exist.json',
			message: 'File does not exists or is not readable (path=/does-not-exist.json)'
		})
	)
})
