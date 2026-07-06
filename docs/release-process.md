# Release Process

This document describes how UC Open Edge releases are versioned, prepared, and published.

---

## Versioning

UC Open Edge follows [Semantic Versioning](https://semver.org/) (SemVer):

| Version component | Meaning                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| **MAJOR** (X.0.0) | Breaking change to event schema, API contract, auth, or config format        |
| **MINOR** (0.X.0) | New feature, new connector/destination, new event type — backward-compatible |
| **PATCH** (0.0.X) | Bug fix, dependency update, documentation change                             |

### v0.x stability policy

While the project is on `v0.x`, the API and event schemas are **not** guaranteed stable.
Breaking changes may occur in minor releases. When this happens:

- The breaking change must be documented in the release notes
- The changelog must include a migration guide
- Consider a deprecation period in the previous minor release where feasible

The project will move to `v1.0.0` when the core event schema, API, and auth model
are considered stable enough for long-term backward compatibility.

---

## Changelog

- Maintain a `CHANGELOG.md` in the root (not yet created — add it before the first release)
- Use [Keep a Changelog](https://keepachangelog.com/) format
- Sections: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`
- Every PR that changes user-facing behavior should include a changelog entry
- The changelog entry is written in the PR and merged with the code change

---

## Release checklist

Before tagging a release, complete all of the following:

- [ ] All CI checks pass on `main` (lint, typecheck, prisma-validate, test, build)
- [ ] `CHANGELOG.md` is up to date with all changes since the last release
- [ ] Version in `package.json` (root) is updated to the new version
- [ ] Docs are updated — especially if a connector, destination, or event type was added
- [ ] `.env.example` reflects any new required or recommended environment variables
- [ ] No known high or critical security vulnerabilities in dependencies (check Dependabot)
- [ ] The migration is tested against a clean database (for releases with schema changes)
- [ ] At least one maintainer has reviewed the release checklist

---

## Tagging and GitHub Release

```bash
# Create and push the release tag
git tag v0.2.0
git push origin v0.2.0
```

Then create a GitHub Release:

1. Go to **Releases → Draft a new release**
2. Tag: `v0.2.0` (must match the pushed tag)
3. Title: `v0.2.0 — <brief summary>`
4. Release notes: copy from `CHANGELOG.md`, lightly edited for audience
5. Mark as pre-release if the project is still on `v0.x` and not yet production-stable
6. Publish the release

---

## Package publishing

**npm and Docker image publishing are not automated yet.**

- Do not add `npm publish` or Docker push to CI until this is an explicit, intentional decision
- When npm publishing is added, use a scoped package `@uc-open-edge/...` and require
  a maintainer to manually trigger it from a protected tag
- When Docker publishing is added, push to GitHub Container Registry (`ghcr.io`) and
  confirm image signing and security scanning are set up first

---

## Breaking schema changes

When a release contains a breaking change to the normalized event schema or database schema:

1. Open an issue or discussion labeled `breaking change` **before** implementing
2. Announce the planned change in the PR description and changelog
3. Provide a migration path — document how existing installations should upgrade
4. If a database migration changes column types or removes data, test carefully and
   note that a database backup is recommended before upgrading
5. Consider whether a deprecation period in the previous release is feasible

---

## Hotfix releases

For urgent security or data-loss bug fixes on an already-released version:

1. Create a branch `hotfix/v0.1.1` from the release tag (`git checkout -b hotfix/v0.1.1 v0.1.0`)
2. Apply the fix with a focused, minimal change
3. Bump the patch version in `package.json`
4. Update `CHANGELOG.md`
5. Get a maintainer code review
6. Tag and release following the standard checklist
