# Using the packages from a neighbouring repository

The `@package/*` libraries in `packages/` are not published to a registry (each one is
`"private": true`). To use them from another repository on the same machine, link them with
`bun link`. The consumer then uses a symlink to the source in this monorepo, so a change here is
visible there at once, with no build and no reinstall.

This is for local development only. A link does not work in CI or in a Docker build, because the
monorepo is not available there.

## How it works

- Each package exports its TypeScript source (`./src/index.ts`) directly. There is no build step.
- `bun link` (in a package directory) registers the package under its name in Bun's global link
  registry.
- `bun link <name> --save` (in the consumer) creates `node_modules/<name>` as a symlink to the
  package directory and adds `"<name>": "link:<name>"` to the consumer's `package.json`.
- Bun follows the symlink to the real path. The package's own dependencies, including other
  `@package/*` packages declared as `workspace:*`, are therefore resolved from **this monorepo's**
  `node_modules`, not from the consumer's.

## 1. Register the packages (in this repository)

Install the dependencies first. The linked packages load their own dependencies from this
repository's `node_modules`.

```bash
cd ~/Lab/bun-packages
bun install
```

Register all the packages:

```bash
for dir in packages/*/; do (cd "$dir" && bun link); done
```

Or register only one:

```bash
cd packages/core
bun link
```

You do this once. The registration stays until you run `bun unlink` in the package directory.

## 2. Link the packages in the consumer repository

```bash
cd ~/Lab/other-repo
bun link @package/core @package/errors --save
```

Do not forget `--save`. Without it (Bun 1.4.2), the symlink is created but `package.json` is not
changed, and the next `bun install` removes the link. You can also add the entries by hand and run
`bun install`.

The consumer's `package.json` then contains:

```json
{
	"dependencies": {
		"@package/core": "link:@package/core",
		"@package/errors": "link:@package/errors"
	}
}
```

After that, `bun install` in the consumer recreates the links, as long as the packages are still
registered on the machine.

You only need to link the packages that the consumer imports directly. The internal dependencies
between packages (for example, `@package/core` → `@package/errors`) come through the monorepo.

## 3. Use the packages

Import them like any other dependency:

```ts
import { generateUUID } from '@package/core'
import { NotFoundError } from '@package/errors'
```

The consumer compiles the TypeScript source of the packages. Its `tsconfig.json` must be
compatible with the [root `tsconfig.json`](../tsconfig.json) of this repository, specifically:

```json
{
	"compilerOptions": {
		"module": "Preserve",
		"moduleResolution": "bundler",
		"allowImportingTsExtensions": true,
		"verbatimModuleSyntax": true,
		"strict": true,
		"noUncheckedIndexedAccess": true,
		"experimentalDecorators": true,
		"emitDecoratorMetadata": true
	}
}
```

`experimentalDecorators` and `emitDecoratorMetadata` are only required for `@package/typeorm`.

## Pitfalls

- **Duplicate libraries.** If the consumer also installs a library that a package uses (for
  example `@sinclair/typebox`, `drizzle-orm`, `fastify` or `typeorm`), two copies are loaded: one
  from each `node_modules`. Checks that depend on identity, such as `instanceof`, symbols or
  plugin registries, can then fail. Keep the versions identical in both repositories. If the
  problem continues, import the library through the package instead of installing it in the
  consumer.
- **Stale dependencies.** If you add a dependency to a package, run `bun install` in this
  repository, not in the consumer.
- **Removing a package.** If you rename or delete a package, its link becomes broken. Run
  `bun unlink` in the old package directory and remove the entry from the consumer's
  `package.json`.
- **CI and Docker.** `link:` dependencies cannot be resolved outside your machine. Before you
  commit a consumer that depends on these packages, the packages must be published to a registry.

## Undo the links

In the consumer:

```bash
bun remove @package/core @package/errors
```

In this repository:

```bash
for dir in packages/*/; do (cd "$dir" && bun unlink); done
```
