## Summary

<!-- Brief description of what this PR does and why. Link to the design doc or discussion if any. -->

## Type of change

- [ ] Bug fix
- [ ] New feature (connector, destination, API endpoint, UI page)
- [ ] Breaking change (schema, API contract, auth, config format)
- [ ] Documentation
- [ ] Refactoring / code quality
- [ ] CI / tooling

## Related issue

Closes #

## Checklist

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes (where applicable)
- [ ] Tests added or updated for changed behavior
- [ ] Documentation updated if functionality was added or changed
- [ ] No `console.log` in production code (use Pino logger)
- [ ] No new untyped `any` introduced
- [ ] I have not included secrets, API keys, passwords, or customer data
- [ ] I have considered security implications of this change
- [ ] I have followed the relevant contribution rules (see below)

---

## Connector changes

<!-- Fill in if this PR adds or modifies a connector. Otherwise delete this section. -->

- Connector type:
- New events ingested:
- Config schema changes (backward-compatible?):
- Does this connector require a proprietary vendor SDK or license? If yes, confirm license is compatible with Apache-2.0:
- Example added to `examples/`?
- Documented in `docs/connectors.md`?

## Destination changes

<!-- Fill in if this PR adds or modifies a destination. Otherwise delete this section. -->

- Destination type:
- Auth / signing mechanism:
- Config schema changes (backward-compatible?):
- Retry behavior documented?

## Event schema changes

<!-- Fill in if this PR changes the normalized event envelope or any event type schema. Otherwise delete this section. -->

- Schema fields added / removed / renamed:
- Is this backward-compatible with existing stored events?
- Has a maintainer reviewed and approved this change?

## Auth / security / database migration changes

<!-- Fill in if this PR touches auth, sessions, API keys, or Prisma migrations. Otherwise delete this section. -->

- Change description:
- Migration is reversible?
- Has a maintainer approved this change?
