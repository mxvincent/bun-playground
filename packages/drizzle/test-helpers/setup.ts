import { EnvValue } from '@package/core'
import { beforeAll } from 'bun:test'
import { SQL } from 'bun'
import { getConnectionConfig, TEST_DATABASE } from './database'


beforeAll(async () => {
	const managementConnection = new SQL(getConnectionConfig(EnvValue.string('POSTGRES_DATABASE') ?? 'mxvincent'))

	const [{ exists }] =
		await managementConnection`select exists(select datname
                                             from pg_catalog.pg_database
                                             where datname = ${TEST_DATABASE})`

	if (!exists) {
		await managementConnection`create database ${managementConnection(TEST_DATABASE)}`
	}
	await managementConnection.close({ timeout: 500 })

	const testConnection = new SQL(getConnectionConfig(TEST_DATABASE))


	await testConnection`
      create table if not exists "author"
      (
          "id"         uuid primary key                     default gen_random_uuid(),
          "name"       text                        not null,
          "created_at" timestamp(3) with time zone not null,
          "gender"     text                        not null default 'unknown',
          "age"        integer
      )
	`

	await testConnection`
      create table if not exists "post"
      (
          "id"        integer primary key generated always as identity,
          "name"      text,
          "author_id" uuid not null references "author" ("id")
      )
	`

	await testConnection`
      create table if not exists "date_container"
      (
          "id" uuid primary key default gen_random_uuid(),
          "a"  timestamp(3) with time zone,
          "b"  timestamp(3) with time zone
      )
	`

	await testConnection.close({ timeout: 500 })
})
