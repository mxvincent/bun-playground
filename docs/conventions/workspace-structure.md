# Workspace structure

## Categories

The monorepo has four workspace categories, declared in the root `package.json`. Each has a distinct
role and a distinct npm scope.

| Directory | Scope | Role |
| --- | --- | --- |
| `packages/*` | `@package/*` | Reusable technical libraries. No business knowledge. |
| `domains/*` | `@domain/*` | Business contracts and types. No I/O. |
| `applications/*` | `@application/*` | Deployable services. Wire a domain onto an infrastructure. |
| `kubernetes` | — | CDK8s infrastructure definitions. Excluded from changesets. |

### `packages/*`

Technical building blocks: JWT handling, error classes, query-parameter parsing, ORM helpers,
telemetry. A package MUST be usable by any application in any domain.

A package MUST NOT depend on `@domain/*` or `@application/*`. A package that needs to know what an
`Organization` is belongs in `domains/`.

### `domains/*`

The vocabulary of a business domain, expressed as types: resource interfaces, event schemas,
factories, and repository **ports** (interfaces describing persistence without implementing it).

A domain MUST NOT perform I/O — no database client, no HTTP call, no file access. It declares the
`OrganizationRepository` interface; an application provides the implementation.

```ts
// domains/account/src/repositories/organization.ts
export type OrganizationRepository = Repository<Organization, CreateOrganization, UpdateOrganization> &
	RepositoryGetPage<Organization>
```

### `applications/*`

Deployable services. This is the only layer allowed to hold infrastructure: database clients, HTTP
servers, message consumers, migrations, adapters implementing domain **ports**.

## Dependency direction

```
applications/*  →  domains/*  →  packages/*
```

- Dependencies MUST flow left to right only.
- Two workspaces in the same category MUST NOT depend on each other, with one exception: a
  `@package/*` MAY depend on another `@package/*` as long as no cycle is created
  (`@package/drizzle` → `@package/query-params` is fine).
- An application MUST NOT import from another application. Extract the shared part into a package or
  a domain.

## Layout of a package

```
packages/<name>/
├── src/
│   ├── <concern>/
│   │   ├── <file>.ts
│   │   └── <file>.test.ts
│   └── index.ts
├── test-helpers/          # optional, only if tests need shared fixtures
├── package.json
└── tsconfig.json
```

- All source code MUST live under `src/`. Biome only sees `**/src/**` and `**/test-helpers/**`;
  code outside those paths is neither formatted nor linted.
- A package is organised in one of two shapes, and MUST NOT mix them:
  - **Flat** — a handful of files directly under `src/`, for a package small enough that grouping
    them would add nothing (`@package/errors`).
  - **By concern** — one directory per concern (`auth/`, `crypto/`, `guards/`, `pagination/`), with
    `index.ts` as the only file at the root of `src/`.
- A concern names a subject, not a grab bag. `auth/`, `pagination/`, `crypto/` are concerns;
  `utils/`, `helpers/`, `common/`, `misc/` and `types/` are not — they collect things that have
  nothing in common but their shape. A type belongs beside the code it describes, in that concern's
  own `types.ts` (`auth/types.ts`, `object/types.ts`).
- Role directories such as `schemas/`, `repositories/`, `factories/` and `commands/` are legitimate
  where the role *is* the subject — in applications and domains, whose layout is fixed below. They
  do not belong in a technical package.
- A package MUST move from flat to by-concern once a concern emerges, rather than leaving a few
  files at the root beside the directories. Half-organised is worse than either shape.
- A concern directory SHOULD hold fewer than about ten files. Past that, split the concern.

## Layout of an application

```
applications/<name>/
├── src/
│   ├── api/                     # one directory per resource, one file per endpoint
│   │   ├── <resource>/<verb>-<resource>.ts
│   │   └── api.ts               # route registration
│   ├── commands/                # executable entrypoints (bun src/commands/<name>.ts)
│   ├── config/                  # one module per configuration section
│   ├── core/                    # application wiring: config loading, server, shared types
│   ├── database/
│   │   ├── client.ts            # the connection
│   │   ├── schema.ts            # the pgSchema
│   │   ├── tables.ts            # the table registry
│   │   ├── schemas/             # one file per table
│   │   ├── repositories/        # one file per aggregate, implements a domain port
│   │   ├── migrations/          # generated, never hand-edited
│   │   └── commands/            # migrate, seed, truncate
│   └── schemas/                 # TypeBox schemas for the public API surface
├── config.example.json
├── package.json
└── tsconfig.json
```

- `api/` MUST hold one file per endpoint. Routes are registered in a single `api.ts`.
- `config/` MUST hold one module per section, each exporting `schema` and `environment`. See
  [code-style.md](./code-style.md#configuration).
- `database/migrations/` is generated by `drizzle-kit`. Migrations MUST NOT be edited by hand once
  applied anywhere.

## `package.json`

```json
{
	"name": "@package/core",
	"version": "0.1.0",
	"private": true,
	"exports": {
		".": {
			"types": "./src/index.ts",
			"default": "./src/index.ts"
		}
	},
	"scripts": {
		"lint:check": "biome lint .",
		"modules:clean": "rm -rf node_modules",
		"test": "bun test",
		"test:watch": "bun test --watch",
		"tsc:check": "tsc --noEmit",
		"tsc:check:watch": "tsc --noEmit --watch"
	},
	"dependencies": {
		"@package/errors": "workspace:*",
		"@sinclair/typebox": "catalog:"
	}
}
```

- `name` MUST be `@<category-singular>/<directory-name>`: `@package/core`, `@domain/account`,
  `@application/account`.
- Every workspace MUST be `"private": true`. Nothing is published to a public registry.
- The entrypoint MUST be declared with `exports` only. `main` MUST NOT be used.
- Internal dependencies MUST use `workspace:*`. The bare `workspace:` form MUST NOT be used.
- Third-party dependencies shared by more than one workspace MUST be declared as `catalog:` and
  their version pinned once in the root `package.json` `catalog` block. A version range MUST NOT be
  duplicated across workspaces.
- A package that expects its consumer to own the driver (`pg`, `drizzle-orm`, `typeorm`) MUST
  declare it as a `peerDependencies` entry, and as a `devDependencies` entry if its own tests need
  it.
- The script names above are the contract Turborepo relies on. A workspace MUST define
  `lint:check`, `tsc:check` and `modules:clean`, and MUST define `test` if it has tests. A workspace
  with no test file MUST still define `test` as `bun test --pass-with-no-tests` so that
  `turbo run test` stays green.

## `tsconfig.json`

Every workspace MUST extend the root configuration and MUST NOT override compiler options other
than `baseUrl` and `paths`.

```json
{
	"extends": "../../tsconfig.json",
	"compilerOptions": {
		"baseUrl": ".",
		"paths": {
			"#*": ["./src/*"],
			"#test-helpers/*": ["./test-helpers/*"]
		}
	}
}
```

- `#*` maps to `./src/*` and MUST be declared by any workspace deep enough to need it. Packages
  organised as a flat set of concerns SHOULD use relative imports instead and declare only
  `#test-helpers/*`.
- The root `tsconfig.json` enables `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`,
  `noFallthroughCasesInSwitch` and `verbatimModuleSyntax`. These MUST NOT be relaxed per workspace.

## Imports

Three forms, in this order of preference:

1. **Cross-workspace** — always by package name, never by relative path.
   ```ts
   import { EnvValue } from '@package/core'
   import type { Organization } from '@domain/account'
   ```
2. **Same workspace, distant** — the `#` alias, with **no slash** after `#`.
   ```ts
   import { database } from '#database/client'
   import { config } from '#core/config'
   ```
   ❌ `import { database } from '#/database/client'` — the `#/…` form MUST NOT be used.
3. **Same concern directory** — relative, and only within the same directory or its parent.
   ```ts
   import { verifyToken } from './jwt'
   import type { Organization } from '../schemas/organization'
   ```

A relative import MUST NOT climb more than one level (`../`). Beyond that, use the `#` alias.

Import order and grouping are handled by Biome's `organizeImports` assist. Do not hand-sort.

## Barrel files

A package or domain MUST expose its public surface through `src/index.ts` and nothing else.
Consumers import from `@package/core`, never from `@package/core/src/auth/jwt`.

The barrel MUST re-export whole modules, grouped by concern, with a blank line between groups and —
where the grouping is not obvious from the paths — a JSDoc section comment.

```ts
export * from './array/as-array'
export * from './array/sort'

export * from './auth/errors'
export * from './auth/jwt'
```

```ts
/**
 * Logger
 */
export * from './logger/logger'
export * from './logger/types'
/**
 * OpenTelemetry SDK
 */
export * from './sdk/sdk'
```

- Internal helpers MUST NOT be exported from the barrel. If it is not part of the contract, leave it
  out.
- Test files, test helpers and `*.test.ts` modules MUST NOT be re-exported.
- Applications have no barrel. They are entrypoints, not libraries.
