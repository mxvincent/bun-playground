import { Type } from 'typebox'
import { PageSchema } from '../schemas/page'
import { ResourceSchema } from '../schemas/resource'
import { DateTime, UUID } from './formats'
import { Nullable, StringEnum } from './unsafe'

/**
 * TypeBox builder extended with the schemas shared by the workspace
 */
export const Schema = {
	...Type,
	Nullable,
	StringEnum,
	DateTime,
	UUID,
	Resource: ResourceSchema,
	Page: PageSchema
}
