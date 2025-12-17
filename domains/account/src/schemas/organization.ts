import type { Deletable, Editable, Resource } from '@package/database'

export interface Organization extends Resource, Editable, Deletable {
	name: string
}
