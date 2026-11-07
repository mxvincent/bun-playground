# Code style

## Formatting

Formatting is owned by Biome (`biome.json`) and `.editorconfig`. It is never a review topic — run
`bun run format:fix`.

| Setting | Value |
| --- | --- |
| Indentation | Tabs, width 2 |
| Quotes | Single |
| Semicolons | As needed (omitted) |
| Trailing commas | None |
| Line width | 120 |
| Line endings | LF |
| Import order | Managed by Biome's `organizeImports` assist |
| Control statements | Always braced, even for a single statement (`useBlockStatements`) |

Biome only sees `**/src/**` and `**/test-helpers/**`. Code placed anywhere else is silently
unformatted and unlinted — see [workspace-structure.md](./workspace-structure.md).

### Suppressions

A lint rule MAY be suppressed inline, and the suppression MUST carry a reason explaining why the
rule does not apply here.

```ts
// biome-ignore lint/suspicious/noExplicitAny: type workaround for Drizzle query builder
const asQuery = (query: any) => query
```

A file-level suppression MUST NOT be used. Suppress the single line that needs it.

## TypeScript

The root `tsconfig.json` is strict and MUST NOT be relaxed per workspace. Three of its options shape
how code is written:

- **`verbatimModuleSyntax`** — every type-only import MUST use `import type`. Mixed imports put
  `type` on the specifier:
  ```ts
  import { type Static, Type } from '@package/json-schema'
  import type { FastifySchema } from 'fastify'
  ```
- **`noUncheckedIndexedAccess`** — indexing an array or record yields `T | undefined`. Handle it
  explicitly; do not reach for `!`.
  ```ts
  const [result] = await database.select().from(organization).where(where).execute()
  return result ?? null
  ```
- **`noImplicitOverride`** — a member that overrides a base member MUST be marked `override`.

Further rules:

- `any` MUST NOT be used. Use `unknown` and narrow. The only exception is a documented workaround
  for a third-party type, suppressed inline with a reason.
- A non-null assertion (`!`) MUST NOT be used. Narrow, provide a default, or throw a typed error.
- A type assertion (`as`) SHOULD be avoided. Prefer `satisfies` to check a literal against a type
  while keeping its narrow inferred shape:
  ```ts
  const CreateOrganizationRequestSchema = {
  	body: CreateOrganizationSchema,
  	response: { 201: OrganizationSchema }
  } satisfies FastifySchema
  ```
- `enum` MAY be used for closed sets of string values that cross a module boundary
  (`TelemetryConfigKey`, `JWTAlgorithm`). Within a single module, a union of string literals is
  preferred.

### `interface` or `type`

- Use `interface` for the shape of a business resource or an extensible contract. Domain resources
  MUST be interfaces:
  ```ts
  export interface Organization extends Resource, Editable, Deletable {
  	name: string
  }
  ```
- Use `type` for unions, intersections, mapped and conditional types, and for types derived from a
  value:
  ```ts
  export type OrganizationRepository = Repository<Organization, CreateOrganization, UpdateOrganization> &
  	RepositoryGetPage<Organization>

  export type OrganizationRow = typeof organization.$inferSelect
  ```

### Functions and classes

- Exported behaviour SHOULD be an arrow function assigned to a `const`. `function` declarations
  MUST NOT be used for exports.
  ```ts
  export const isString = (value: unknown): value is string => typeof value === 'string'
  ```
- An exported function MUST declare its return type explicitly. Inference is fine for local
  functions.
- A `class` is justified in three cases and SHOULD NOT be used otherwise:
  1. it holds state across calls (`RateLimitingService`, `DrizzleCursorPager`),
  2. it implements a port with more than one interchangeable implementation (repositories),
  3. it is an error type.
- A namespace of related pure functions MUST be a module with named exports, not a class with static
  methods — with one exception: a class MAY group static overloads when the overload set *is* the
  API surface (`EnvValue.string`, `EnvValue.number`, `EnvValue.boolean`).

## Errors

- A thrown error MUST be an instance of a class extending `BaseError` from `@package/errors`.
  `throw new Error('…')` MUST NOT appear in production code.
- An error class MUST declare a `code` (`SCREAMING_SNAKE_CASE`) and, when it maps to HTTP, a
  `statusCode`.
  ```ts
  export class ConflictError extends BaseError {
  	code = 'CONFLICT'
  	override statusCode = 409
  }
  ```
- Error classes MUST live in an `errors/` directory (or `errors.ts` for a single one) within their
  package, one class per file when there are several.
- An error carrying context MUST expose it as fields and surface it in `toJSON()`, so that logging
  and HTTP serialization both see it:
  ```ts
  override toJSON() {
  	return { ...super.toJSON(), resource: { type: this.resourceType, id: this.resourceId } }
  }
  ```
- A `catch` block MUST NOT swallow an error. Either handle it meaningfully, or log and rethrow:
  ```ts
  } catch (error) {
  	logger.error({ error }, 'Failed to get organizations page.')
  	throw error
  }
  ```
- Control flow MUST NOT depend on an error message string. Match on the class or the `code`.

## Schemas and validation

TypeBox is the single schema language: HTTP contracts, configuration, and event payloads.

- Schemas MUST be built with the `Schema` builder from `@package/json-schema`, not with `Type`
  directly. The builder adds the shared formats (`Schema.UUID`, `Schema.DateTime`,
  `Schema.Nullable`, `Schema.StringEnum`) and the shared shapes (`Schema.Resource`, `Schema.Page`).
  ```ts
  export const OrganizationSchema = Schema.Resource({
  	name: Schema.String()
  })
  ```
  `Type` MAY be used directly in `config/` modules, where no shared format applies.
- A resource schema MUST be built with `Schema.Resource`, which supplies `id`, `createdAt` and
  `updatedAt`. Those fields MUST NOT be redeclared.
- A paginated response MUST be `Schema.Page(<ItemSchema>)`.
- Schemas that describe a public API surface live in `src/schemas/`. A schema used by exactly one
  endpoint MUST stay local to that endpoint's file.
- Every configuration and public schema property SHOULD carry a `description`, and every bounded
  numeric property SHOULD carry `minimum` / `maximum`:
  ```ts
  port: Type.Integer({
  	description: 'Server listening port.',
  	default: 4000,
  	minimum: 1024,
  	maximum: 65535
  })
  ```

## HTTP endpoints

- A handler MUST be declared with the `endpoint` helper from `@package/fastify-plugins`, which ties
  the request and reply types to the schema.
- The request schema MUST be defined in the same file, named `<Operation>RequestSchema`, and closed
  with `satisfies FastifySchema`.
- The handler MUST declare its return type explicitly.
- A handler MUST NOT contain persistence logic. It validates, delegates to a repository or service,
  and returns.

```ts
const CreateOrganizationRequestSchema = {
	body: CreateOrganizationSchema,
	response: { 201: OrganizationSchema }
} satisfies FastifySchema

export const createOrganization = endpoint(CreateOrganizationRequestSchema, async (request): Promise<Organization> => {
	return await organizationRepository.create(request.body)
})
```

## Configuration

Configuration is layered: defaults declared in the schema, overridden by a JSON config file,
overridden by environment variables. It is validated once at startup and fails fast.

- Each section MUST be its own module under `src/config/`, exporting exactly two symbols:
  ```ts
  // src/config/server.ts
  export const schema = Type.Object({ /* … */ })
  export const environment = {
  	host: EnvValue.string('SERVER_HOST'),
  	port: EnvValue.number('SERVER_PORT')
  }
  ```
- Sections MUST be assembled in `src/core/config.ts` into a single validated `config` object.
- `process.env` MUST NOT be read anywhere outside `src/config/*` and `src/core/config.ts`. Read
  values through `EnvValue` from `@package/core`, which enforces required-ness and defaults.
- A default value MUST be declared in the schema, not in the `environment` object.
- `config.example.json` MUST be kept in sync when a section gains a key.

## Logging

- Use the `logger` exported by `@package/telemetry`. `console.log` MUST NOT appear in committed
  code.
- The structured object comes first, the message second. The message MUST be a static string —
  never interpolated with runtime values, which belong in the object.
  ```ts
  logger.info({ path }, 'Config file loaded.')
  logger.error({ error }, 'Failed to get organizations page.')
  ```
- A log message SHOULD be a capitalised sentence ending with a period.
- Levels: `fatal` for a failure that stops the process, `error` for a failed operation, `warn` for a
  recoverable anomaly, `info` for lifecycle events, `debug` for development detail.
- Secrets, tokens and credentials MUST NOT be logged. Pass errors as `{ error }` so the configured
  serializer handles them.

## Comments

- Comments explain *why*, not *what*. A comment restating the code MUST be removed.
- A non-obvious workaround MUST be commented with its cause, as with lint suppressions.
- JSDoc SHOULD be used on exported symbols whose purpose is not evident from the name, and on the
  section groups of a barrel file.
