import { AsyncLocalStorage } from 'async_hooks'

export abstract class AsyncStore<TValues> {
	#store = new AsyncLocalStorage<TValues>()

	get isInitialized(): boolean {
		return this.#store.getStore() !== undefined
	}

	get values(): TValues {
		const values = this.#store.getStore()
		if (values) {
			return values
		}
		throw new Error('Context is not initialized.')
	}

	/**
	 * Create an async asyncContext for the function
	 *
	 * @param values - Options used to create the asyncContext
	 * @param callback - Function for which the asyncContext is created
	 * @returns Forward the given function result
	 */
	run<T>(values: Partial<TValues>, callback: () => T) {
		return this.#store.run(this.applyDefaults(values), callback)
	}

	/**
	 * Wrap a function with async asyncContext
	 *
	 * @param originalFunction - The function to wrap
	 * @param contextProvider - A function to provide asyncContext
	 * @returns A wrapped function that executes within the given asyncContext
	 */
	wrap<TArgs extends unknown[], TReturn>(
		originalFunction: (...args: TArgs) => TReturn,
		contextProvider?: () => Partial<TValues>
	): (...args: TArgs) => TReturn {
		return (...args: TArgs): TReturn => {
			const store = this.applyDefaults(contextProvider ? contextProvider() : undefined)
			return this.#store.run(store, () => originalFunction(...args))
		}
	}

	/**
	 * Get a specific value from the current asyncContext
	 * @param key - The key to retrieve from asyncContext
	 * @returns The value for the given key or undefined
	 * @throws When asyncContext is not initialized
	 */
	getValue<K extends keyof TValues>(key: K): TValues[K] {
		return this.values[key]
	}

	/**
	 * Set a specific value in the current asyncContext
	 * @param key - The key to set in the asyncContext
	 * @param value - The related value
	 * @throws When asyncContext is not initialized
	 */
	setValue<K extends keyof TValues>(key: K, value: TValues[K]) {
		this.values[key] = value
	}

	enter(values?: Partial<TValues>): TValues {
		const store = this.applyDefaults(values)
		this.#store.enterWith(store)
		return store
	}

	exit() {
		return this.#store.disable()
	}

	protected abstract applyDefaults(values?: Partial<TValues>): TValues
}

export class AsyncStoreManager<TValues> {
	readonly store: AsyncStore<TValues>

	constructor(store: AsyncStore<TValues>) {
		this.store = store
	}

	wrap<TArgs extends unknown[], TReturn>(
		originalFunction: (...args: TArgs) => TReturn,
		contextProvider?: () => Partial<TValues>
	): (...args: TArgs) => TReturn {
		return this.store.wrap(originalFunction, contextProvider)
	}

	enter(values: Partial<TValues> = {}): TValues {
		return this.store.enter(values)
	}

	exit(): void {
		this.store.exit()
	}
}
