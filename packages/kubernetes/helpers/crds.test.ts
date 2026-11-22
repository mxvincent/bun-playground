import { describe, expect, test } from 'bun:test'
import { extractCrds } from './crds'

const crd = (group: string) => `apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: things.${group}
spec:
  group: ${group}
`

describe('extractCrds', () => {
	test('keeps the CustomResourceDefinitions of the group and drops the other documents', () => {
		const deployment = 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: operator\n'
		const manifest = [crd('example.io'), deployment, crd('generators.example.io'), crd('example.io')].join('---\n')
		expect(extractCrds(manifest, 'example.io').map((document) => document.trim())).toEqual([
			crd('example.io').trim(),
			crd('example.io').trim()
		])
	})
})
