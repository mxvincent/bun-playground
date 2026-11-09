import { expect, it } from 'bun:test'
import { Sort } from '@package/query-params'
import { serializeSorts } from './serialize'

it('serializes the direction and the path of each sort', () => {
	expect(serializeSorts([Sort.desc('createdAt'), Sort.asc('id')])).toStrictEqual(['desc(createdAt)', 'asc(id)'])
})
