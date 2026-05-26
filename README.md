# agent-card-fleet-summary

Fleet-analyze a directory of [A2A AgentCard](https://github.com/mizcausevic-dev/agent-cards-spec) documents. Counts by autonomy / memory; surfaces the governance gaps that hurt an audit — autonomous agents missing incident-response URIs, persistent-memory agents with no refusal taxonomy, destructive tools on non-autonomous agents.

> Status: v0.1.0 — Node 20/22 supported, library + CLI.

## What it flags

| Code | Severity | Rule |
|---|---|---|
| `autonomous-without-incident-response-uri` | 🔴 | `autonomy_level=autonomous` but `safety_posture.incident_response_uri` is missing (the spec requires the conjunction). |
| `no-evaluations-on-autonomous` | 🔴 | Autonomous agent with no `evaluations[]` entries. |
| `destructive-tool-on-non-autonomous` | 🟠 | Agent declares destructive tools without being marked autonomous — confirm gating. |
| `persistent-memory-without-refusal-taxonomy` | 🟠 | `memory_persistence=persistent` but no refusal categories declared. |
| `empty-refusal-taxonomy` | 🟡 | No refusal categories at all. |
| `no-evaluations` | 🟡 | No evaluations on a non-autonomous agent. |
| `missing-homepage` | ℹ️ | `agent.homepage` not set. |

## CLI

```
npx agent-card-fleet-summary <cards-dir>
    [--format json|markdown|summary]
    [--now <iso>]
    [--fail-on-high]
    [--out FILE]
```

## Library

```ts
import { summarize, toMarkdown } from "agent-card-fleet-summary";

const report = summarize(cards);
console.log(report.byAutonomy);      // { assistive, supervised, autonomous }
console.log(report.findings);
console.log(toMarkdown(report));
```

## Composes with

- [**`agent-cards-spec`**](https://github.com/mizcausevic-dev/agent-cards-spec) — the schema this reads.
- [**`agent-card-diff`**](https://github.com/mizcausevic-dev/agent-card-diff) — diff two cards across versions.
- [**`agent-card-tool-coverage`**](https://github.com/mizcausevic-dev/agent-card-tool-coverage) — verify a card's declared tools against an MCP server's `tools/list`.
- [**`mcp-tool-card-summary`**](https://github.com/mizcausevic-dev/mcp-tool-card-summary) — sibling for the MCP Tool Card side.

## Develop

```
npm install
npm run lint && npm run typecheck && npm run coverage && npm run build
npm run demo
```

## License

[AGPL-3.0-or-later](LICENSE)
