# Security Policy

## Supported versions

`dossier` is currently pre-1.0. Security patches are applied to the **latest published version** only.

| Version | Supported |
|---|---|
| latest (0.x) | ✅ |
| older releases | ❌ |

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Use GitHub's private vulnerability reporting instead:

1. Go to the [Security tab](https://github.com/stefanhoth/dossier/security) of this repository
2. Click **"Report a vulnerability"**
3. Fill in a description, reproduction steps, and the potential impact

You can also reach the maintainer directly at **stefanhoth.de@gmail.com** with the subject line `[dossier] Security disclosure`.

### What to expect

| Step | Timeline |
|---|---|
| Acknowledgement | Within 48 hours |
| Initial assessment | Within 5 business days |
| Patch / advisory | Depends on severity — critical issues within 14 days |

## Out of scope

The following are **not** considered security vulnerabilities for this project:

- Malformed or invalid JSONL input — handled via the Dead Letter Queue by design
- Chain verification failures on tampered files — this is expected and intended behaviour
- Denial of service via very large log files — operational concern, not a CVE
- Vulnerabilities in optional peer infrastructure (PostgreSQL, npm registry)

## Disclosure policy

Once a fix is released, a GitHub Security Advisory will be published with full details. We follow coordinated disclosure — please give us reasonable time to patch before public disclosure.
