# Versioning and releases

Every workspace is versioned independently with [Changesets](https://github.com/changesets/changesets).
Versions are bumped, changelogs written and tags created by CI. None of it is done by hand.

## Public surface

The bump level depends on what changed in a workspace's **public surface** — the part consumers rely
on. What that means differs by category:

| Category | Public surface |
| --- | --- |
| `packages/*` | Everything re-exported from `src/index.ts`: signatures, types, error `code` values, runtime behaviour |
| `domains/*` | The same, plus the shape of resource interfaces and event schemas |
| `applications/*` | The HTTP contract, the AMQP events published, the database schema, the configuration keys |

Anything not on that list — an internal helper, a private field, a test — is not public surface, and
changing it is a `patch` at most.

## Bump levels

Every workspace is currently below `1.0.0`. Under semver, `0.x` versions carry no compatibility
promise, so the levels are applied by intent rather than by contract, and `major` stays reserved for
the eventual `1.0.0`.

| Level | When |
| --- | --- |
| `patch` | Bug fix, internal refactor, performance work, dependency bump, documentation of a package |
| `minor` | New export, new optional parameter, new endpoint, new event — anything a consumer can adopt without editing existing calls |
| `major` | A change that forces every consumer to edit their code. Reserved for `1.0.0` and beyond; before that, use `minor` and say so in the summary |

Decide from the consumer's point of view. Adding a field to a response is `minor`; removing one is
breaking even though the code still compiles.

### Special cases

- **Database migration** — an additive migration (new table, new nullable column) is `minor` on the
  owning application. A destructive one (dropped or renamed column, tightened constraint) is
  breaking: it MUST be called out explicitly in the changeset summary, and it MUST be deployable
  before the code that depends on it. Split it into two releases rather than one.
- **HTTP contract** — a new endpoint or a new optional query parameter is `minor`. A changed status
  code, a removed field or a newly required parameter is breaking.
- **AMQP event** — a new event or a new optional field is `minor`. Changing the meaning of an
  existing field, or removing one, is breaking: consumers are deployed separately and will read the
  old shape for a while.
- **Type-only change** — a widened type is `minor`, a narrowed one is breaking, even when no runtime
  behaviour changed. `tsc` failing in a consumer is a broken consumer.
- **Configuration key** — a new key with a default is `minor`. A renamed or newly required key is
  breaking, because the deployed environment must change with it.

## Changesets

```bash
bunx changeset
```

- A changeset MUST be added in the same pull request as the change it describes, for every modified
  versioned workspace. Reviewers enforce this — CI does not.
- `kubernetes` is excluded from versioning (`.changeset/config.json`). Changes to it never need a
  changeset.
- Internal dependents are bumped as `patch` automatically (`updateInternalDependencies`). Do not add
  changesets for them by hand.
- No changeset is needed for a change with no consumer-visible effect: CI configuration, repository
  documentation, tests, or a change confined to `kubernetes`.
- In a stack, the changeset belongs to the layer that makes the change, not to the top of the stack.

### Writing the summary

The summary is what appears in the changelog, read by someone deciding whether to upgrade. Write a
sentence from the consumer's point of view — not a commit subject, not an implementation note.

```md
---
'@package/typeorm': minor
---

Pass sort as Pager.getPage() parameter
```

- State the change, not the diff. ✅ *Cursor pagination now handles null values in sorted columns*
  ❌ *Fix `buildCursorCondition`*
- A breaking change MUST say what consumers have to do about it, in the summary itself.
- One changeset MAY cover several workspaces when a single change touches them together. Use
  separate changesets when the changes are independent, even if they ship in the same pull request.

## Release pipeline

Releases run on every push to `main` (`.github/workflows/release-main.yaml`). The sequence:

1. **Collect** — the Changesets action opens or updates a *release pull request* gathering every
   pending changeset, titled `release(main): <ISO timestamp>`.
2. **Version** — merging that pull request runs `scripts/changeset-version.sh`, which applies the
   bumps, writes the `CHANGELOG.md` files, regenerates the CDK8s deployment manifests
   (`bun run --filter kubernetes generate-manifests`), and commits the result.
3. **Tag and publish** — Changesets tags each bumped workspace. Workspaces are `private`, so nothing
   goes to a public registry; the tag is the release record.
4. **Build** — for every published application, the Docker build workflow is dispatched, and the
   deploy workflow runs after it.

Never do by hand: bump a `version` field, edit a `CHANGELOG.md`, create a release tag, write a
`release(...)` commit, or edit the generated kubernetes manifests. All of them are regenerated and
your edit will be overwritten or will corrupt the release.

The pipeline also supports Changesets pre-release mode (`.changeset/pre.json`) and a `next` branch.
Releases MUST be cut from `main` or `next`; the release script refuses any other branch.

## Application versions and Docker images

An application's package version is its release identity end to end.

- Image tags are derived from that version by `docker/metadata-action`: the full version, the
  `major.minor` prefix, the `major` prefix, and a commit-`sha` tag.
  A version `0.2.1` publishes `0.2.1`, `0.2`, `0`, and `sha-<commit>`.
- A version already present in the registry is never rebuilt — the `docker-image-exists` action
  short-circuits the build. **A released version is immutable.** A version MUST NOT be reused for
  different content; to publish a fix, cut a new version.
- An application therefore MUST have a changeset for any change that needs to be deployed. Without
  one, the version does not move, no image is built, and nothing reaches the cluster — the pull
  request merges and silently changes nothing in production.
- Packages and domains have versions but no images. They reach production only through the
  applications that depend on them, which is why internal dependents are auto-bumped: that bump is
  what triggers the application's rebuild.
