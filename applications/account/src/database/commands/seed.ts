import { randomInt } from 'node:crypto'
import { factories, type Organization, type OrganizationMember, type UserAccount } from '@domain/account'
import { randomArrayItem, TextSequence } from '@package/core'
import { logger, serializers, syncLogger } from '@package/telemetry'
import type { PgTable } from 'drizzle-orm/pg-core'
import type { PgInsertValue } from 'drizzle-orm/pg-core/query-builders/insert'
import { chunk, times } from 'es-toolkit/compat'
import { database } from '#/database/client'
import { tables } from '#database/tables'

const reportPerformance = (mark: string, message: string, context: Record<string, unknown> = {}) => {
	const time = new Date().toLocaleTimeString()
	const duration = (performance.measure(mark, mark).duration / 1000).toFixed(3)
	logger.debug({ context }, `(${time}) ${message} (${duration}s)`)
}

const insert = async <TableType extends PgTable, DataType extends PgInsertValue<TableType>>(
	table: TableType,
	values: DataType[]
) => {
	await Promise.all(chunk(values, 5_000).map((chunkValues) => database.insert(table).values(chunkValues)))
	return values
}

const populateOrganization = (data: { organizations: Organization[]; users: UserAccount[] }): OrganizationMember[] => {
	return data.organizations.flatMap((organization: Organization) => {
		const members = new WeakSet<UserAccount>()
		const getUserAccount = (): UserAccount => {
			const user = randomArrayItem(data.users)
			if (members.has(user)) {
				return getUserAccount()
			}
			members.add(user)
			return user
		}
		return times(randomInt(0, 101), () =>
			factories.organizationMember({
				organization,
				user: getUserAccount()
			})
		)
	})
}

enum Mark {
	start = 'START',
	createUsers = 'CREATE_USER',
	createOrganizations = 'CREATE_ORGANIZATION',
	createOrganizationMembers = 'CREATE_ORGANIZATION_MEMBER'
}

const seedDatabase = async () => {
	performance.mark(Mark.start)

	const sequences = {
		users: new TextSequence('user', await database.$count(tables.user)),
		organizations: new TextSequence('organization', await database.$count(tables.organization))
	}

	const seed = async (chunkId: number) => {
		performance.mark(Mark.createUsers)

		const users = await insert(
			tables.user,
			times(10_000, () => {
				const username = sequences.users.next()
				return factories.userAccount({
					username,
					email: `${username}@mx.cloud`
				})
			})
		)
		reportPerformance(Mark.createUsers, `[#${chunkId}] ${users.length} users created`)

		performance.mark(Mark.createOrganizations)
		const organizations = await insert(
			tables.organization,
			times(2_000, () => factories.organization({ name: sequences.organizations.next() }))
		)
		reportPerformance(Mark.createOrganizations, `[#${chunkId}] ${organizations.length} organizations created`)

		performance.mark(Mark.createOrganizationMembers)
		const organizationMembers = populateOrganization({ organizations, users })
		await insert(
			tables.organizationMember,
			organizationMembers.map(({ user, organization, ...values }) => ({
				...values,
				organizationId: organization.id,
				userId: user.id
			}))
		)
		reportPerformance(
			Mark.createOrganizationMembers,
			`[#${chunkId}] ${organizationMembers.length} organization members created`
		)

		return {
			organizations: organizations.length,
			organizationMembers: organizationMembers.length,
			users: users.length
		}
	}

	for (let i = 0; i < 8; i++) {
		await seed(i)
	}

	reportPerformance(Mark.start, 'Seed operation completed', {
		organizations: sequences.organizations.value,
		users: sequences.users.value,
		organizationMember: await database.$count(tables.organizationMember)
	})
}

try {
	await seedDatabase()
} catch (error) {
	syncLogger.fatal({ error: serializers.error(error) })
} finally {
	await database.$client.end()
	process.exit()
}
