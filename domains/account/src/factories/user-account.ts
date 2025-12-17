import { randomStringGenerator } from '@package/core'
import { type Factory, generateResource } from '@package/database'
import type { UserAccount } from '../schemas/user-account'

export const createUserAccount: Factory<UserAccount> = (values = {}) => {
	return {
		...generateResource(values),
		deletedAt: values?.deletedAt ?? null,
		email: values?.email ?? ``,
		username: values?.username ?? `user-${randomStringGenerator.generate(8)}`
	}
}
