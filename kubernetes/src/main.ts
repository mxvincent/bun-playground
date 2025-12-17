import { synthesizeAllResources } from '#/helpers/scope'
import { AccountService } from '#charts/account-service'
import { Environment } from '#interfaces/environment'

new AccountService(Environment.DEVELOPMENT)

synthesizeAllResources()
