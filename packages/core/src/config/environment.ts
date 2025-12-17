type WithDefaultValue<T> = { default: T }
type WithRequiredValue = { required: boolean }
type GetEnvValueOptions<T> = WithDefaultValue<T> | WithRequiredValue

export class EnvValue {
	private static get(name: string, isRequired: true): string
	private static get(name: string, isRequired: boolean): string | undefined
	private static get(name: string, isRequired: boolean): string | undefined {
		const value = process.env[name]
		if (isRequired && value === undefined) {
			throw new Error(`Environment variable is missing: ${name}`)
		}
		return value
	}

	static boolean(name: string, options: WithDefaultValue<boolean>): boolean
	static boolean(name: string, options: WithRequiredValue): boolean
	static boolean(name: string): boolean | undefined
	static boolean(name: string, options?: GetEnvValueOptions<boolean>): boolean | undefined {
		const value = EnvValue.get(name, !!options && 'required' in options && options.required)
		if (value) {
			return value === 'true' || value === '1'
		}
		if (options && 'default' in options) {
			return options.default
		}
	}

	static number(name: string, options: WithDefaultValue<number>): number
	static number(name: string, options: WithRequiredValue): number
	static number(name: string): number | undefined
	static number(name: string, options?: GetEnvValueOptions<number>): number | undefined {
		const value = EnvValue.get(name, !!options && 'required' in options && options.required)
		if (value) {
			return Number(value)
		}
		if (options && 'default' in options) {
			return options.default
		}
	}

	static string(name: string, options: WithDefaultValue<string>): string
	static string(name: string, options: WithRequiredValue): string
	static string(name: string): string | undefined
	static string(name: string, options?: GetEnvValueOptions<string>): string | undefined {
		const value = EnvValue.get(name, !!options && 'required' in options && options.required)
		if (value) {
			return value
		}
		if (options && 'default' in options) {
			return options.default
		}
	}
}
