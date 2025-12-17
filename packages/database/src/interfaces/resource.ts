export interface Resource {
	id: string
	createdAt: Date
}

export interface Editable {
	updatedAt: Date
}

export interface Deletable {
	deletedAt: Date | null
}
