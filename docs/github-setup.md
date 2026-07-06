# GitHub Repository Setup

This document describes the manual GitHub settings a maintainer should enable for the
`uc-open-edge` repository. These settings cannot be managed through files in the repo —
they must be configured in the GitHub UI by a repository owner.

---

## 1. General settings

Go to **Settings → General**.

| Setting                            | Value                                        |
| ---------------------------------- | -------------------------------------------- |
| Visibility                         | Public                                       |
| Default branch                     | `main`                                       |
| Squash merging                     | **Enabled**                                  |
| Merge commits                      | **Disabled**                                 |
| Rebase merging                     | Optional — disable if you prefer squash-only |
| Automatically delete head branches | **Enabled**                                  |

---

## 2. Branch ruleset for `main`

Go to **Settings → Rules → Rulesets → New ruleset → New branch ruleset**.

- **Ruleset name:** `Protect main`
- **Enforcement status:** Active
- **Target branches:** `main`
- **Rules to enable:**
  - Restrict deletions
  - Require a pull request before merging
    - Required approvals: **1**
    - Dismiss stale pull request approvals when new commits are pushed: **On**
    - Require review from code owners: **On** (after CODEOWNERS is set up)
    - Require conversation resolution before merging: **On**
  - Require status checks to pass
    - Add each CI job after the first CI run succeeds (see Required checks below)
    - Require branches to be up to date before merging: **On**
  - Block force pushes

### Required CI checks to add (after first CI run)

Once CI has run at least once on a PR, add these required status checks in the ruleset:

- `Lint`
- `Typecheck`
- `Prisma validate`
- `Test`
- `Build`

---

## 3. Security features

Go to **Settings → Security & analysis**.

| Feature                         | Setting                                                              |
| ------------------------------- | -------------------------------------------------------------------- |
| Dependabot alerts               | **Enabled**                                                          |
| Dependabot security updates     | **Enabled**                                                          |
| Secret scanning                 | **Enabled**                                                          |
| Push protection                 | **Enabled** (prevents accidentally pushing secrets)                  |
| Code scanning                   | **Enabled** — CodeQL is configured in `.github/workflows/codeql.yml` |
| Private vulnerability reporting | **Enabled** — allows security researchers to report privately        |

---

## 4. Actions permissions

Go to **Settings → Actions → General**.

| Setting                                                  | Value                                       |
| -------------------------------------------------------- | ------------------------------------------- |
| Actions permissions                                      | Allow all actions (or restrict to trusted)  |
| Workflow permissions                                     | **Read repository contents only** (default) |
| Allow GitHub Actions to create and approve pull requests | **Disabled**                                |
| Require approval for first-time contributor workflows    | **Enabled**                                 |

---

## 5. Tag protection (once releases begin)

Go to **Settings → Rules → Rulesets → New tag ruleset**.

- **Target tags:** `v*`
- **Rules:** Restrict creations (only maintainers can push release tags), Restrict deletions

---

## 6. Discussions (optional)

Go to **Settings → General → Features → Discussions → Enable**.

If enabled, update `.github/ISSUE_TEMPLATE/config.yml` to point the Discussions link to the
correct URL. This is recommended to reduce support-style issues from the issue tracker.

---

## 7. Repository topics and description

Go to the main repo page and set:

- **Description:** Open-source local edge integration framework for connecting warehouse, robotics, manufacturing, automation, sensor, and operational systems to business platforms.
- **Topics:** `edge-computing`, `warehouse`, `robotics`, `manufacturing`, `iot`, `fastify`, `sveltekit`, `prisma`, `typescript`, `opcua`, `mqtt`

---

## Follow-up checklist

- [ ] Replace `@YOUR_GITHUB_USERNAME` in `.github/CODEOWNERS` with real GitHub username(s)
- [ ] Confirm `security@unbeatablecommerce.com` is monitored and reaches the right people
- [ ] Confirm `maintainers@unbeatablecommerce.com` is monitored
- [ ] Enable all security features listed above
- [ ] Add required CI checks after the first CI run on a PR
- [ ] Enable Discussions if desired and update `config.yml`
- [ ] Apply tag protection ruleset when the first release is cut
- [ ] Set repository description and topics
