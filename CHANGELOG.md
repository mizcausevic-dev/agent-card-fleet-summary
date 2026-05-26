# Changelog

## v0.1.0 — 2026-05-27

- Initial release: fleet-analyze a directory of A2A AgentCard documents.
- Counts by `autonomy_level` (assistive / supervised / autonomous) and `memory_persistence` (none / session / persistent). Tool-use and destructive-tool totals.
- 7 finding codes: `autonomous-without-incident-response-uri`, `no-evaluations-on-autonomous`, `destructive-tool-on-non-autonomous`, `persistent-memory-without-refusal-taxonomy`, `empty-refusal-taxonomy`, `no-evaluations`, `missing-homepage`.
- Library API: `summarize(cards, now?)` → `FleetReport`; `toMarkdown(report)` + `toSummary(report)` formatters.
- CLI: `agent-card-fleet-summary <cards-dir>` with `--format json|markdown|summary`, `--now <iso>`, `--fail-on-high`, `--out FILE`.
- Lane #4 A2A — mirrors `mcp-tool-card-summary` for the AgentCard side. Composes with `agent-cards-spec`, `agent-card-diff`, `agent-card-tool-coverage`.
- Node 20/22 CI (lint, typecheck, coverage, build, demo, `npm audit`), AGPL-3.0-or-later, Dependabot.
