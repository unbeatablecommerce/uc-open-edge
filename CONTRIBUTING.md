# Contributing to UC Open Edge

Thank you for your interest in contributing! UC Open Edge is an open-source project and
contributions are welcome from the community.

## Code of Conduct

By participating, you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- **Bug reports** — open an issue using the Bug Report template
- **Feature requests** — open an issue using the Feature Request template
- **Connectors** — implement a new source connector (see Connector rules below)
- **Destinations** — implement a new delivery destination (see Destination rules below)
- **Documentation** — improve docs, add examples, fix typos
- **Tests** — increase test coverage

---

## Development setup

### Prerequisites

- Node.js 22+
- Docker + Docker Compose (for local Postgres)
- pnpm (enabled via `corepack enable pnpm`)

### Steps

```bash
git clone https://github.com/your-org/uc-open-edge.git
cd uc-open-edge
corepack enable pnpm
pnpm install
cp .env.example .env
# Edit .env — set SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
docker compose up -d postgres
pnpm db:migrate:dev   # apply migrations against local dev DB
pnpm db:seed          # create initial admin user
```

### Running the full stack locally

```bash
# In separate terminals (or use docker compose):
pnpm --filter @uc-open-edge/api dev      # API → http://localhost:3001
pnpm --filter @uc-open-edge/worker dev   # Background worker
pnpm --filter @uc-open-edge/admin dev    # Admin UI → http://localhost:3000
```

---

## Useful commands

| Command               | Description                                      |
| --------------------- | ------------------------------------------------ |
| `pnpm lint`           | Run ESLint across all packages                   |
| `pnpm lint:fix`       | Auto-fix lint errors                             |
| `pnpm typecheck`      | Run TypeScript type-checking across all packages |
| `pnpm test`           | Run all unit/integration tests                   |
| `pnpm build`          | Build all packages and apps                      |
| `pnpm format`         | Format all files with Prettier                   |
| `pnpm format:check`   | Check formatting without writing                 |
| `pnpm db:generate`    | Regenerate the Prisma client                     |
| `pnpm db:migrate`     | Apply pending migrations (production-safe)       |
| `pnpm db:migrate:dev` | Create and apply a new migration (dev only)      |
| `pnpm db:validate`    | Validate the Prisma schema without connecting    |
| `pnpm db:seed`        | Seed the database with the initial admin user    |

---

## Branch naming

| Pattern                        | Use for                              |
| ------------------------------ | ------------------------------------ |
| `feature/<short-description>`  | New features                         |
| `fix/<short-description>`      | Bug fixes                            |
| `docs/<short-description>`     | Documentation only                   |
| `chore/<short-description>`    | Tooling, CI, dependency updates      |
| `refactor/<short-description>` | Code cleanup without behavior change |

Branch names should be lowercase, hyphen-separated, and descriptive.

---

## Commit expectations

- Use clear, present-tense commit messages: `add webhook connector`, `fix session cookie sameSite`, `update event schema for robotics domain`
- Keep commits focused — one logical change per commit
- Squash-merge is used on `main`; the PR title becomes the merge commit message
- Reference related issues in commits where relevant: `fixes #42`

---

## Pull request expectations

1. Fork the repository and create a branch from `main`
2. Make your changes with tests and documentation where applicable
3. Run `pnpm lint && pnpm typecheck && pnpm test` before pushing
4. Open a pull request against `main` using the PR template
5. Keep PRs focused — one feature or fix per PR
6. All CI checks must pass before merging
7. At least one maintainer review is required

---

## Connector contribution rules

1. Copy an existing connector (`connectors/file-drop`) as a template
2. Follow the [Connector Development Guide](docs/connector-development.md)
3. Implement the `IConnector` interface from `@uc-open-edge/connector-sdk`
4. Register the connector in the worker's connector runtime
5. Add an example in `examples/`
6. Document it in `docs/connectors.md`
7. **Do not bundle proprietary vendor SDKs** without a license review — if the target
   system requires a paid or NDA-restricted SDK, the connector must document this clearly
   and must not include the SDK source code in the repository
8. Do not include real credentials, API endpoints, or customer-specific configuration
   in the connector source or examples

---

## Destination contribution rules

1. Follow the [Destination SDK](packages/destination-sdk/README.md) and implement `IDestination`
2. Document the destination in `docs/destinations.md`
3. Include retry and error handling conforming to the `DeliveryResult` shape
4. If the destination involves external auth (OAuth, API keys), document how to configure it
   without including real credentials
5. Do not include real credentials or customer-specific endpoints

---

## Event schema change policy

Changes to the normalized event envelope (`packages/schemas`) or any event type schema affect
all connectors and destinations and all stored event data. Follow these rules:

- **Backward-compatible additions** (new optional field, new event type) can be proposed via PR
  and reviewed normally
- **Breaking changes** (renaming a required field, removing a field, changing a field type) require
  a maintainer discussion and explicit approval before implementation
- When possible, prefer additive changes that do not break existing stored events
- Changes to the core envelope (`eventType`, `domain`, `occurredAt`, `externalEventId`, etc.)
  require maintainer review and should be rare

---

## Security-sensitive change policy

The following areas require extra care and **explicit maintainer approval** before merging:

- Authentication logic (session handling, cookie configuration, login flow)
- API key authentication, hashing, or scoping
- Prisma database migrations (irreversible migrations require special review)
- Role-based access control changes
- Any code that handles secrets, credentials, or tokens

If you are unsure whether your change falls into this category, ask in the PR or open an issue first.

**Never include real secrets, passwords, API keys, or customer data in any PR, commit, or issue.**

---

## Documentation expectations

- If you add a new connector, destination, or feature, update the relevant doc file in `docs/`
- If you change a configuration option, update `.env.example` and any relevant doc
- README examples should remain accurate — test them before updating
- Use clear English; diagrams and code samples are welcome

---

## Code review expectations

- Reviewers will focus on correctness, security, and maintainability
- Be respectful and constructive in review comments
- Address all review comments before requesting re-review
- Maintainers may request tests, docs, or refactors before merging

---

## License

By contributing, you agree that your contributions will be licensed under the
[Apache-2.0 License](LICENSE).
