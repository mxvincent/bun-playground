import { expect, test } from 'bun:test'
import { AsyncStore } from './async-store'

type Values = { requestId: string; userId?: string }

class TestStore extends AsyncStore<Values> {
	protected applyDefaults(values?: Partial<Values>): Values {
		return { requestId: 'default', ...values }
	}
}

test('throws when values are read outside of a context', () => {
	expect(() => new TestStore().values).toThrow('Context is not initialized.')
})

test('run() exposes the values merged with the defaults', () => {
	const store = new TestStore()
	expect(store.run({ userId: 'user' }, () => store.values)).toStrictEqual({ requestId: 'default', userId: 'user' })
})

test('wrap() runs the function in a context built by the provider', () => {
	const store = new TestStore()
	const getRequestId = store.wrap(
		() => store.getValue('requestId'),
		() => ({ requestId: 'provided' })
	)
	expect(getRequestId()).toBe('provided')
})

test('setValue() updates the value of the current context', () => {
	const store = new TestStore()
	store.run({}, () => {
		store.setValue('userId', 'user')
		expect(store.getValue('userId')).toBe('user')
	})
})
