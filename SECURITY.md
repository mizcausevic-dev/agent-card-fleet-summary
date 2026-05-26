# Security Policy

`agent-card-fleet-summary` is a pure-transform library and CLI: it reads JSON AgentCard documents from a directory and emits a structured summary. No network listener, no remote fetch, no execution of user-supplied code.

The input may include agent identifiers, provider names, and deployment metadata sensitive in your environment. The report includes agent ids + names; treat the input and report as you would your AgentCard repository itself.

## Supported versions

Only the latest tagged release is supported.

## Reporting a vulnerability

Please use GitHub Security Advisories for private disclosure:

- [Open a security advisory](https://github.com/mizcausevic-dev/agent-card-fleet-summary/security/advisories/new)

Do not file public issues for security reports.
