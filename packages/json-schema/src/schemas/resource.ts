import { type TObject, type TObjectOptions, type TProperties, type TString, Type } from 'typebox'
import { DateTime, UUID } from '../builder/formats'

export type ResourceProperties = {
	id: TString
	createdAt: TString
	updatedAt: TString
}

export const getResourceProperties = (): ResourceProperties => ({
	id: UUID({ description: 'Resource unique identifier.' }),
	createdAt: DateTime({
		description: 'A date representing when this resource was created.'
	}),
	updatedAt: DateTime({
		description: 'A date representing when this resource was last updated.'
	})
})

export const ResourceSchema = <T extends TProperties>(
	properties: T,
	options?: TObjectOptions
): TObject<ResourceProperties & T> => {
	return Type.Object(Object.assign(getResourceProperties(), properties), options)
}
