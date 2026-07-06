# Security Policy

## Supported versions

| Version                                     | Supported                |
| ------------------------------------------- | ------------------------ |
| `main` branch                               | Yes — latest development |
| Latest released minor (once releases exist) | Yes                      |
| Older releases                              | No — please upgrade      |

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Report security issues by emailing the maintainers at
**[security@unbeatablecommerce.com](mailto:security@unbeatablecommerce.com)**.

All reports are handled confidentially. We follow responsible disclosure and will
work with you to understand, confirm, and fix the issue before any public announcement.

### What to include in your report

- Type of vulnerability (e.g., authentication bypass, credential exposure, injection, privilege escalation)
- Affected version, branch, or commit SHA
- File paths and line numbers of the relevant source code
- Any special configuration or environment needed to reproduce the issue
- Step-by-step reproduction instructions
- Proof-of-concept or exploit code (if available)
- Impact assessment — what an attacker could achieve and under what conditions

### Response timeline

| Milestone                         | Target                                        |
| --------------------------------- | --------------------------------------------- |
| Acknowledgement of receipt        | Within 72 hours                               |
| Initial assessment / confirmation | Within 7 days when possible                   |
| Fix or mitigation shipped         | Varies by severity                            |
| Credit in release notes           | Upon disclosure (unless you prefer anonymity) |

We will keep you informed throughout. Please allow reasonable time before public disclosure.

## Scope

The following are in scope for vulnerability reports:

- Authentication and session management flaws (login, session cookies, logout)
- API key authentication vulnerabilities
- Connector ingestion vulnerabilities (injection, malformed payload handling, unauthorized ingest)
- Destination delivery security (HMAC signing, credential handling)
- Secret or credential leakage (via logs, API responses, or error messages)
- Dependency vulnerabilities with a practical exploit path
- Unsafe default configuration that exposes the system without obvious warning

## Out of scope

The following are **not** in scope:

- Social engineering or phishing
- Spam or rate-limiting issues against non-production demo environments
- Denial-of-service attacks against demo or development deployments
- Vulnerabilities that require already-compromised local administrator access, unless
  they enable privilege escalation or lateral movement beyond what is expected
- Reports from automated scanners with no manual verification of exploitability

## Deployment hardening

In addition to reporting vulnerabilities, ensure your production deployment follows these guidelines:

- Always use HTTPS in production
- Set a strong, unique `SESSION_SECRET` (minimum 32 random bytes; generate with `openssl rand -hex 32`)
- Restrict `CORS_ORIGINS` to only your admin UI origin
- Use a dedicated Postgres user with minimum required privileges
- Keep the `ADMIN_EMAIL`/`ADMIN_PASSWORD` credentials secure and change the default password after first login
- Rotate API keys regularly
- Review audit logs for suspicious activity
- Enable Dependabot security updates on your fork
