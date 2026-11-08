import { expect, it } from 'bun:test'
import { ResourceSchema, Type } from '../index'

it('adds id, createdAt and updatedAt to the given properties', () => {
	const schema = ResourceSchema({ name: Type.String() })
	expect(Object.keys(schema.properties)).toStrictEqual(['id', 'createdAt', 'updatedAt', 'name'])
})
