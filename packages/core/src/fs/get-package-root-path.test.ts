import { expect, test } from 'bun:test'
import { resolve } from 'node:path'
import { getPackageRootPath } from './get-package-root-path'

const PACKAGE_ROOT = resolve(import.meta.dir, '../..')

test('returns the closest directory holding a package.json', () => {
	expect(getPackageRootPath(import.meta.path)).toBe(PACKAGE_ROOT)
})

test('throws when no parent directory holds a package.json', () => {
	expect(() => getPackageRootPath('/no-package/file.ts')).toThrow('Failed to find package root directory.')
})
