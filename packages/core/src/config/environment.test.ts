import { beforeAll, describe, expect, test } from 'bun:test'
import { EnvValue } from './environment'

beforeAll(() => {
	process.env.TEST_STRING = 'a-value'
	process.env.TEST_TRUE = 'true'
	process.env.TEST_FALSE = 'false'
	process.env.TEST_0 = '0'
	process.env.TEST_1 = '1'
})

describe('environment', () => {
	describe('Env.string()', () => {
		test('should return undefined', () => {
			expect(EnvValue.string('TEST_UNDEFINED')).toEqual(undefined)
		})
		test('should return value', () => {
			expect(EnvValue.string('TEST_STRING', { default: 'a-default' })).toBe('a-value')
		})
		test('should return value rather than the default', () => {
			expect(EnvValue.string('TEST_STRING', { default: 'a-default' })).toBe('a-value')
		})
		test('should return default when value does not exists', () => {
			expect(EnvValue.string('TEST_UNDEFINED', { default: 'a-default' })).toBe('a-default')
		})
		test('should throw and error when required variable is missing', () => {
			expect(() => EnvValue.string('TEST_UNDEFINED', { required: true })).toThrow(
				'Environment variable is missing: TEST_UNDEFINED'
			)
		})
	})

	describe('Env.boolean()', () => {
		test('should return undefined', () => {
			expect(EnvValue.boolean('TEST_UNDEFINED')).toEqual(undefined)
		})
		test('should return true (value=true)', () => {
			expect(EnvValue.boolean('TEST_TRUE')).toBe(true)
		})
		test('should return true (value=true,default=false)', () => {
			expect(EnvValue.boolean('TEST_TRUE', { default: false })).toBe(true)
		})
		test('should return false (value=false)', () => {
			expect(EnvValue.boolean('TEST_FALSE')).toBe(false)
		})
		test('should return false (value=false,default=true)', () => {
			expect(EnvValue.boolean('TEST_FALSE', { default: true })).toBe(false)
		})
		test('should return true (value=1)', () => {
			expect(EnvValue.boolean('TEST_1')).toBe(true)
		})
		test('should return false (value=0)', () => {
			expect(EnvValue.boolean('TEST_0')).toBe(false)
		})
		test('should return default value (default=true)', () => {
			expect(EnvValue.boolean('TEST_UNDEFINED', { default: true })).toBe(true)
		})
		test('should return default value (default=false)', () => {
			expect(EnvValue.boolean('TEST_UNDEFINED', { default: false })).toBe(false)
		})
		test('should throw and error when required variable is missing', () => {
			expect(() => EnvValue.boolean('TEST_UNDEFINED', { required: true })).toThrow(
				'Environment variable is missing: TEST_UNDEFINED'
			)
		})
	})

	describe('Env.number()', () => {
		test('should return undefined', () => {
			expect(EnvValue.number('TEST_UNDEFINED')).toEqual(undefined)
		})
		test('should return value (value=0)', () => {
			expect(EnvValue.number('TEST_0')).toBe(0)
		})
		test('should return value (value=0,default=1)', () => {
			expect(EnvValue.number('TEST_0', { default: 1 })).toBe(0)
		})
		test('should return value (value=1)', () => {
			expect(EnvValue.number('TEST_1')).toBe(1)
		})
		test('should return value (value=1,default=0)', () => {
			expect(EnvValue.number('TEST_1', { default: 0 })).toBe(1)
		})
		test('should return default (default=0)', () => {
			expect(EnvValue.number('TEST_UNDEFINED', { default: 0 })).toBe(0)
		})
		test('should return default (default=1)', () => {
			expect(EnvValue.number('TEST_UNDEFINED', { default: 1 })).toBe(1)
		})
		test('should throw and error when required variable is missing', () => {
			expect(() => EnvValue.number('TEST_UNDEFINED', { required: true })).toThrow(
				'Environment variable is missing: TEST_UNDEFINED'
			)
		})
	})
})
