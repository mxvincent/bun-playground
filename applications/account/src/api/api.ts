import plugin from 'fastify-plugin'
import { createOrganization } from '#/api/organizations/create-organization'
import { listOrganizations } from '#/api/organizations/list-organizations'
import { deleteOrganization } from '#api/organizations/delete-organization'
import { getOrganization } from '#api/organizations/get-organization'
import { updateOrganization } from '#api/organizations/update-organization'

export const api = plugin(async (app) => {
	app.get('/', () => ({ status: 'OK' }))
	app.get('/organizations', listOrganizations)
	app.get('/organizations/:organizationId', getOrganization)
	app.patch('/organizations/:organizationId', updateOrganization)
	app.delete('/organizations/:organizationId', deleteOrganization)
	app.post('/organizations', createOrganization)
})
