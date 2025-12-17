import { isNil } from 'es-toolkit'

export function stringToDate(value: string): Date
export function stringToDate(value?: string): Date | undefined
export function stringToDate(value?: string | null): Date | null | undefined
export function stringToDate(value?: string | null): Date | null | undefined {
	return isNil(value) ? value : new Date(value)
}

export function dateToString(value: Date): string
export function dateToString(value?: Date | null): string | null | undefined
export function dateToString(value?: Date | null): string | null | undefined {
	return isNil(value) ? value : value.toISOString()
}
