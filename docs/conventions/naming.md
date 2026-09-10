# Naming

## Files and directories

- File and directory names MUST be `kebab-case`. No `camelCase`, no `PascalCase`, no underscores.
  ✅ `random-array-item.ts`, `organization-member.ts`, `postgres-data-source.ts`
  ❌ `applyFilters.ts`, `PostgresConfig.ts`, `sortPath.ts`, `publishMessage.ts`
- Directories MUST be plural when they hold a collection of like things: `schemas/`,
  `repositories/`, `factories/`, `services/`, `guards/`, `migrations/`, `commands/`.
- Directories MUST be singular when they name a concern rather than a collection: `auth/`, `crypto/`,
  `json/`, `logger/`, `pagination/`, `database/`, `core/`, `config/`.
- Files MUST be singular. One file describes one thing.
  ✅ `schemas/organization.ts`, `repositories/organization.ts`, `services/organization.ts`,
  `database/schemas/organization.ts`
  ❌ `services/organizations.ts`, `database/schemas/organizations.ts`
- A file name MUST NOT repeat its directory. Inside `repositories/`, the file is `organization.ts`,
  not `organization-repository.ts`.
- A test file MUST be named `<file-under-test>.test.ts` and sit next to its subject. See
  [testing.md](./testing.md).

## TypeScript identifiers

| Kind | Case | Example |
| --- | --- | --- |
| Interface, type alias, class | `PascalCase` | `Organization`, `PageQueryParameters`, `DrizzleCursorPager` |
| Enum name | `PascalCase` | `TelemetryConfigKey`, `JWTAlgorithm` |
| Enum member | `SCREAMING_SNAKE_CASE` | `SERVICE_NAME`, `IN_MEMORY`, `HS256` |
| Function, method | `camelCase` | `generateUUID`, `parseAndValidateQueryParameters` |
| Variable, instance, object property | `camelCase` | `organizationRepository`, `createdAt` |
| Module-level constant with a fixed value | `SCREAMING_SNAKE_CASE` | `TEST_DATABASE`, `SECRET` |
| Type parameter | `PascalCase`, descriptive | `Schema`, `Resource`, `T` for a single trivial parameter |

- A module-level `const` holding a *computed* or *configured* value stays `camelCase`
  (`logger`, `config`, `organizationRepository`). `SCREAMING_SNAKE_CASE` is for literal constants
  only.
- Acronyms are treated as words except when the whole identifier is an acronym:
  `generateUUID`, `JWTAlgorithm`, `httpClient`, not `generateUuid` or `HTTPclient`.
- Booleans MUST read as predicates: `isRequired`, `hasNextPage`, `useSequentialIds`.
  Not `required`, `nextPage`, `sequentialIds`.
- Type guards MUST be named `is<Thing>` and assertions `assert<Thing>`:
  ```ts
  export const isString = (value: unknown): value is string => typeof value === 'string'
  export const assertString = (value: unknown): string => { /* … */ }
  ```

## Language and spelling

- All identifiers, comments, commit messages and documentation MUST be written in English.
- Spelling MUST be American English: `organization`, `serialize`, `behavior`, `color`.
  ❌ `organisation`, `serialise`, `behaviour`.
- Identifiers MUST spell words out: `parameters`, `configuration`, `environment`, `database` — not
  `params`, `conf`, `env`, `db`. Established acronyms are not abbreviations and are fine as such:
  `id`, `uuid`, `jwt`, `sql`, `amqp`, `otel`.
- Existing package names keep the form they were published under (`@package/query-params`); the rule
  above applies to identifiers and to new names.

## Reserved suffixes

A suffix is a promise about what the thing is. Use these only for their stated meaning, and always
use them when the meaning applies.

| Suffix | Meaning | Example |
| --- | --- | --- |
| `…Schema` | A TypeBox schema value | `OrganizationSchema`, `ResourceSchema` |
| `…RequestSchema` | The `FastifySchema` of one endpoint | `CreateOrganizationRequestSchema` |
| `…Error` | A class extending `BaseError` | `ResourceNotFoundError`, `AmqpClientError` |
| `…Repository` | A persistence port (domain) or its implementation (application) | `OrganizationRepository`, `OrganizationPostgresRepository` |
| `…Service` | A stateful holder of business behaviour | `RateLimitingService` |
| `…Row` | A type inferred from a database table | `OrganizationRow` |
| `…Options` | An options bag parameter type | `FindResourceOptions`, `GetEnvValueOptions` |
| `…Parameters` | A set of query or call parameters | `PageQueryParameters`, `organizationParameters` |

- A repository implementation MUST name its backing technology:
  `OrganizationPostgresRepository`, `FakeOrganizationRepository`. The bare `OrganizationRepository`
  name is reserved for the domain port.
- `…Manager`, `…Helper`, `…Util`, `…Data`, `…Info` MUST NOT be used as suffixes. They describe
  nothing. Name the thing after what it does.

## Database objects

- Table names MUST be `snake_case` **singular**: `organization`, `organization_member`, `user`.
- Column names MUST be `snake_case`: `created_at`, `organization_id`, `deleted_at`.
- A foreign key column MUST be `<referenced_table>_id`: `organization_id`, `user_id`.
- The TypeScript property mapped to a column MUST be its `camelCase` form. The mapping is written
  explicitly in the table definition:
  ```ts
  export const organization = accountSchema.table('organization', {
  	...resourceColumns,
  	name: text('name').notNull().unique()
  })
  ```
- Every application MUST own a single Postgres schema, named after the application and created via
  `pgSchema` in `src/database/schema.ts`.
- The exported table symbol MUST be `camelCase` singular and match the table name:
  `organization`, `organizationMember`. Its inferred row type MUST be `<Name>Row`.
- Relations MUST be exported as `<table>Relations`; the sortable/filterable column map as
  `<table>Parameters`.
- Migration files are named by `drizzle-kit`. Their names are not a convention to maintain.

## HTTP endpoints

- One endpoint per file, under `src/api/<resource-plural>/`.
- The file MUST be named `<verb>-<resource>.ts` where the verb describes the operation and the
  resource is singular for single-item operations, plural for collections:
  `create-organization.ts`, `get-organization.ts`, `list-organizations.ts`,
  `update-organization.ts`, `delete-organization.ts`.
- The file MUST export one symbol, `camelCase`, matching the file name: `createOrganization`.
- Verbs MUST be drawn from this set unless the operation genuinely is something else:
  `list`, `get`, `create`, `update`, `delete`. `fetch`, `retrieve`, `remove` and `post` MUST NOT be
  used for these.
- Routes MUST be plural and lower-case; path parameters MUST be `camelCase` and prefixed by the
  resource: `/organizations`, `/organizations/:organizationId`.

## Environment variables and configuration keys

- Environment variables MUST be `SCREAMING_SNAKE_CASE`, prefixed by the subsystem they configure:
  `POSTGRES_HOST`, `SERVER_PORT`, `TELEMETRY_SERVICE_NAME`, `RABBITMQ_VHOST`.
- Configuration keys read from the config file MUST be `camelCase` and grouped by section
  (`app`, `database`, `server`), mirroring the modules in `src/config/`.
- A duration key MUST carry its unit: `keepAliveTimeoutInMilliseconds`, `windowInSeconds`. A bare
  `timeout` MUST NOT be used.

## Error codes

- An error `code` MUST be `SCREAMING_SNAKE_CASE` and describe the condition, not the HTTP status
  word for word: `RESOURCE_NOT_FOUND`, `UNPROCESSABLE_ENTITY`, `AMQP_CLIENT_ERROR`.
- A code MUST be unique across the monorepo. It is part of the API contract.

## Test names

See [testing.md](./testing.md#naming) for `describe` and `test` naming.
