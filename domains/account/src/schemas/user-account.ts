import type { Deletable, Editable, Resource } from '@package/database'

export interface UserAccount extends Resource, Editable, Deletable {
	email: string
	username: string
}
