import { describe, expect, it } from 'bun:test'
import { jsonToBuffer } from './json-to-buffer.ts'

const buffer = Buffer.from([123, 34, 97, 34, 58, 34, 116, 101, 115, 116, 34, 125])
const json = { a: 'test' }

describe('jsonToBuffer()', () => {
	it('should return buffer', async () => {
		expect(jsonToBuffer(json)).toStrictEqual(buffer)
	})
})
