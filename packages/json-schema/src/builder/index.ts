import { JsonTypeBuilder } from '@sinclair/typebox'
import { PageSchema } from '../schemas/page'
import { ResourceSchema } from '../schemas/resource'
import { DateTime, UUID } from './formats'
import { Nullable, StringEnum } from './unsafe'

class SchemaBuilder extends JsonTypeBuilder {
	Nullable = Nullable
	StringEnum = StringEnum
	DateTime = DateTime
	UUID = UUID
	Resource = ResourceSchema
	Page = PageSchema
}

export const Schema = new SchemaBuilder()
