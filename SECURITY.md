# Security Policy

This project is a static website generated from markdown pages. It has no user accounts, no database and collects no personal data, so the realistic risks are a vulnerable dependency, a malicious change in a pull request, or a problem in the CI/CD workflows.

## Reporting a vulnerability

Please **do not open a public issue** for a security problem. Report it privately:

1. Go to the repository's **Security** tab.
2. Click **Report a vulnerability** (GitHub private vulnerability reporting).
3. Describe what you found and how to reproduce it.

You will get a reply as soon as the maintainer can. Please allow a reasonable time to fix it before disclosing publicly.

## Supported versions

Only the latest version on the `main` branch (the live site) is supported.

## Notes for contributors

- Never put secrets, tokens or personal information in a pull request.
- Pull requests from forks run the CI workflow without access to repository secrets.
- Be wary of links in suggested sources. Do not add links to gold-selling or download sites.
