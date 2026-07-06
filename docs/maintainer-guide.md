# Maintainer Guide

This guide is for maintainers and trusted contributors who have merge access to the
`uc-open-edge` repository.

---

## Reviewing pull requests

### General review checklist

- [ ] CI passes (lint, typecheck, prisma-validate, test, build)
- [ ] The change is focused and the PR title is clear
- [ ] Tests are present and meaningful (not just "makes CI green")
- [ ] Documentation is updated where appropriate
- [ ] No secrets, customer data, or proprietary content is included
- [ ] No `any` types that could hide type errors
- [ ] No `console.log` in production code (Pino logger should be used)
- [ ] Security implications have been considered (see specific sections below)

### Merge strategy

- Use **squash merge** on `main`; the PR title becomes the commit message
- The commit message should be descriptive, present-tense, and reference the issue if any
- Do not merge a PR that has unresolved review conversations
- Do not merge your own PR without a second reviewer unless it is trivial (typo, doc fix)

---

## Reviewing connector contributions

Connectors extend the ingest surface of UC Open Edge. Review with care:

1. **Does it implement `IConnector` correctly?**
   Check that `validateConfig`, `start`, `stop`, and event emission follow the connector SDK contract.

2. **Does it handle errors gracefully?**
   A connector that throws uncaught errors or silently drops events is worse than no connector.

3. **Does it require a proprietary SDK?**
   - If yes: confirm the SDK license is compatible with Apache-2.0
   - If the SDK cannot be included, the connector must document the external dependency
     clearly and fail with a helpful message when the SDK is not installed
   - **Do not merge connectors that bundle proprietary vendor SDKs without license review**

4. **Does it include real credentials or customer-specific configuration?**
   - If yes: request changes; real credentials must never be in the repo

5. **Are config fields documented and validated with Zod?**

6. **Is there an example in `examples/`?**

7. **Is it documented in `docs/connectors.md`?**

---

## Reviewing destination contributions

Destinations control where normalized events are delivered. Review with care:

1. **Does it implement `IDestination` correctly?**
   Check `deliver`, `validateConfig`, and `test` methods.

2. **Does `DeliveryResult` include meaningful error info?**
   The worker uses this for retry decisions and logging.

3. **Does it handle auth securely?**
   - Credentials must come from config, not be hardcoded
   - If HMAC signing is involved, check the implementation for timing-safe comparison

4. **Does it include real credentials or endpoints?**
   - If yes: request changes

5. **Is it documented in `docs/destinations.md`?**

---

## Reviewing event schema changes

Event schema changes affect all stored events and all connectors/destinations.

1. **Is this additive (new optional field, new event type)?**
   - Generally safe; review for naming consistency with existing event types

2. **Is this a breaking change (rename, removal, type change)?**
   - Requires maintainer discussion first — do not merge without explicit approval
   - Needs a migration path documented in the PR

3. **Does the Zod schema match the TypeScript types?**

4. **Are new event types consistent with existing naming conventions?**
   - `domain.noun.verb` format (e.g., `inventory.movement.reported`, `equipment.status.changed`)

---

## Handling security reports

When a report arrives at `security@unbeatablecommerce.com`:

1. **Acknowledge receipt** within 72 hours — even a one-line "received, we will investigate" is sufficient
2. **Assess severity** using CVSS or pragmatic judgment:
   - Critical: unauthenticated remote code execution, auth bypass, secret leakage in API responses
   - High: privilege escalation, SQL injection with meaningful impact
   - Medium: limited-scope auth or injection issues
   - Low: information disclosure, hardening gaps
3. **Reproduce the issue** in a local environment
4. **Fix in a private branch** — do not push to `main` until the fix is ready
5. **Coordinate disclosure** with the reporter — agree on a public disclosure date
6. **Backport** to any supported releases
7. **Ship the fix**, create a GitHub Security Advisory, credit the reporter (unless they prefer anonymity)
8. **Post-mortem** — add a note to the release changelog and consider whether the class of issue
   warrants a broader code review

---

## Triaging issues

When a new issue arrives:

1. **Add labels** — at minimum: `type: bug` / `type: feature` / `type: connector` / etc.
2. **Add priority** if obvious: `priority: high` for data loss, security, or broken installs
3. **Add domain label** if applicable
4. **Add `needs reproduction`** if the bug report lacks enough detail to reproduce
5. **Close duplicates** with a link to the canonical issue
6. **Close out-of-scope requests** politely with an explanation
7. **Tag `good first issue`** for issues with well-defined scope that don't require deep context

---

## Labeling issues

See `.github/labels.yml` for the full label set and descriptions. Key decisions:

- `type: security` — add to any Dependabot PR or security-related fix (in addition to type labels)
- `breaking change` — add when a PR or issue involves a backward-incompatible change
- `blocked` — add when a PR is waiting on an external dependency or another PR
- `help wanted` — add when maintainers want community input but won't lead implementation

---

## Handling Dependabot pull requests

Dependabot opens PRs weekly for npm, GitHub Actions, and Docker updates (see `.github/dependabot.yml`).

### Patch / minor npm updates (grouped)

- Check that CI passes
- Review the diff if any packages touch auth, database, or crypto
- Merge if CI is green and nothing security-relevant changed

### Major npm updates

- Review the package changelog for breaking changes
- Test locally if the package is in `packages/db`, `apps/api`, or auth-related code
- Do not merge major Prisma or SvelteKit updates without testing the full build and migration

### Security updates (any severity)

- Treat as `priority: high`
- Merge as soon as CI passes unless the package is a false positive (no exploit path)

### GitHub Actions updates

- Review the updated action version for known issues
- Merge when CI passes

---

## Avoiding unsafe vendor-specific code or secrets

Watch for these patterns in contributor PRs:

| Pattern                                         | Action                                               |
| ----------------------------------------------- | ---------------------------------------------------- |
| Hardcoded API endpoints, keys, or passwords     | Request immediate changes; do not merge              |
| Proprietary vendor SDK bundled in `connectors/` | Check SDK license; request removal if incompatible   |
| `console.log` in production code                | Request change to Pino logger                        |
| `any` types hiding real errors                  | Request typed alternative                            |
| Customer-specific event types or field names    | Ask contributor to generalize                        |
| Direct database queries bypassing Prisma        | Review carefully; prefer Prisma ORM                  |
| Disabling or weakening auth checks              | Reject unless there is a very clear, reviewed reason |

---

## Cutting a release

See [docs/release-process.md](release-process.md) for the full release checklist and process.
