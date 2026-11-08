import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { EnvValue } from './environment'

const VARIABLES = {
	TEST_STRING: 'a-value',
	TEST_TRUE: 'true',
	TEST_FALSE: 'false',
	TEST_0: '0',
	TEST_1: '1'
}

beforeAll(() => {
	Object.assign(process.env, VARIABLES)
})

afterAll(() => {
	for (const name of Object.keys(VARIABLES)) {
		delete process.env[name]
	}
})

describe('EnvValue.string()', () => {
	test('returns undefined when the variable is missing', () => {
		expect(EnvValue.string('TEST_UNDEFINED')).toBeUndefined()
	})
	test('returns the value rather than the default', () => {
		expect(EnvValue.string('TEST_STRING', { default: 'a-default' })).toBe('a-value')
	})
	test('returns the default when the variable is missing', () => {
		expect(EnvValue.string('TEST_UNDEFINED', { default: 'a-default' })).toBe('a-default')
	})
	test('returns the value of a required variable', () => {
		expect(EnvValue.string('TEST_STRING', { required: true })).toBe('a-value')
	})
	test('throws when a required variable is missing', () => {
		expect(() => EnvValue.string('TEST_UNDEFINED', { required: true })).toThrow(
			'Environment variable is missing: TEST_UNDEFINED'
		)
	})
})

describe('EnvValue.boolean()', () => {
	test('returns undefined when the variable is missing', () => {
		expect(EnvValue.boolean('TEST_UNDEFINED')).toBeUndefined()
	})
	test.each([
		['TEST_TRUE', true],
		['TEST_1', true],
		['TEST_FALSE', false],
		['TEST_0', false]
	])('parses %s as %p', (name, expected) => {
		expect(EnvValue.boolean(name)).toBe(expected)
	})
	test('returns the value rather than the default', () => {
		expect(EnvValue.boolean('TEST_FALSE', { default: true })).toBe(false)
	})
	test('returns the default when the variable is missing', () => {
		expect(EnvValue.boolean('TEST_UNDEFINED', { default: true })).toBe(true)
	})
	test('throws when a required variable is missing', () => {
		expect(() => EnvValue.boolean('TEST_UNDEFINED', { required: true })).toThrow(
			'Environment variable is missing: TEST_UNDEFINED'
		)
	})
})

describe('EnvValue.number()', () => {
	test('returns undefined when the variable is missing', () => {
		expect(EnvValue.number('TEST_UNDEFINED')).toBeUndefined()
	})
	test('parses the value', () => {
		expect(EnvValue.number('TEST_1')).toBe(1)
	})
	test('returns the value rather than the default', () => {
		expect(EnvValue.number('TEST_0', { default: 1 })).toBe(0)
	})
	test('returns the default when the variable is missing', () => {
		expect(EnvValue.number('TEST_UNDEFINED', { default: 1 })).toBe(1)
	})
	test('throws when a required variable is missing', () => {
		expect(() => EnvValue.number('TEST_UNDEFINED', { required: true })).toThrow(
			'Environment variable is missing: TEST_UNDEFINED'
		)
	})
})
