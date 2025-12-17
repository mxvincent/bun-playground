import type { OrganizationRepository } from '../repositories/organization'

export class OrganizationService {
	repository: OrganizationRepository

	constructor(repository: OrganizationRepository) {
		this.repository = repository
	}
}
