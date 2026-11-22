import { isNil } from 'es-toolkit'

export function stringToDate(value: string): Date
export function stringToDate(value?: string): Date | undefined
export function stringToDate(value?: string | null): Date | null | undefined
// biome-ignore lint/plugin: overloads need a function declaration
export function stringToDate(value?: string | null): Date | null | undefined {
	return isNil(value) ? value : new Date(value)
}

export function dateToString(value: Date): string
export function dateToString(value?: Date | null): string | null | undefined
// biome-ignore lint/plugin: overloads need a function declaration
export function dateToString(value?: Date | null): string | null | undefined {
	return isNil(value) ? value : value.toISOString()
}
