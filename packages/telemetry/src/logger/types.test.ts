import { expect, it } from 'bun:test'
import { isPinoLogLevel, LogLevel } from './types'

it.each(Object.values(LogLevel))('accepts the %p log level', (level) => {
	expect(isPinoLogLevel(level)).toBe(true)
})

it('rejects another value', () => {
	expect(isPinoLogLevel('verbose')).toBe(false)
})
