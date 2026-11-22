# CLAUDE.md

Guidance for Claude Code in this repository.

## Commands

```bash
bun install                                   # install dependencies

bun run turbo:test                            # test every workspace
bun run --filter=@package/core test           # test one workspace
bun test packages/core/src/auth/jwt.test.ts   # test one file

bun run turbo:typecheck                       # type-check every workspace
bun run --filter=@package/core tsc:check      # type-check one workspace

bun run turbo:lint                            # lint every workspace
bun run format:check                          # check formatting (Biome)
bun run format:fix                            # fix formatting (Biome)

# from applications/account
bun run dev:app-server                        # start the dev server
bun run db:generate                           # generate migrations
bun run db:migrate                            # run migrations
bun run db:seed                               # seed the database
```

## Repository

A Bun monorepo orchestrated by Turborepo: `packages/*` (`@package/*`), `domains/*` (`@domain/*`),
`applications/*` (`@application/*`) and `kubernetes`. Their roles, layout and dependency rules are in
[docs/conventions/workspace-structure.md](docs/conventions/workspace-structure.md).

## Conventions

The conventions in `docs/conventions/` are normative. Each document loads into the session when it
applies (see its index below).

@docs/conventions/README.md
