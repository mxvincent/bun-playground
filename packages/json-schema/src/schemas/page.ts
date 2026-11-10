import { type TSchema, Type } from 'typebox'

export const PageSchema = <T extends TSchema>(NodeSchema: T) => {
	return Type.Object({
		edges: Type.Array(Type.Object({ node: NodeSchema, cursor: Type.String() })),
		hasNextPage: Type.Boolean(),
		totalCount: Type.Integer()
	})
}
