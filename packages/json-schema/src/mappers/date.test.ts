import { expect, it } from 'bun:test'
import { dateToString, stringToDate } from './date'

it('stringToDate() parses an ISO 8601 string', () => {
	expect(stringToDate('2026-01-01T00:00:00.000Z')).toStrictEqual(new Date(Date.UTC(2026, 0, 1)))
})

it('dateToString() formats a date as an ISO 8601 string', () => {
	expect(dateToString(new Date(Date.UTC(2026, 0, 1)))).toBe('2026-01-01T00:00:00.000Z')
})

it.each([null, undefined])('stringToDate() and dateToString() return %p as is', (value) => {
	expect([stringToDate(value), dateToString(value)]).toStrictEqual([value, value])
})
