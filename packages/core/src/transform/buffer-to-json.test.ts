import { describe, expect, it } from 'bun:test'
import { bufferToJson } from './buffer-to-json.ts'

const buffer = Buffer.from([123, 34, 97, 34, 58, 34, 116, 101, 115, 116, 34, 125])
const json = { a: 'test' }

describe('bufferToJson()', () => {
	it('should return json', async () => {
		expect(bufferToJson(buffer)).toStrictEqual(json)
	})
})
