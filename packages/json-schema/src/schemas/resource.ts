import type { ObjectOptions, TObject, TProperties, TString } from '@sinclair/typebox'
import { Schema } from '../builder'

export type ResourceProperties = {
	id: TString
	createdAt: TString
	updatedAt: TString
}

export const getResourceProperties = (): ResourceProperties => ({
	id: Schema.UUID({ description: 'Resource unique identifier.' }),
	createdAt: Schema.DateTime({
		description: 'A date representing when this resource was created.'
	}),
	updatedAt: Schema.DateTime({
		description: 'A date representing when this resource was last updated.'
	})
})

export const ResourceSchema = <T extends TProperties>(
	properties: T,
	options?: ObjectOptions
): TObject<ResourceProperties & T> => {
	return Schema.Object(Object.assign(getResourceProperties(), properties), options)
}
