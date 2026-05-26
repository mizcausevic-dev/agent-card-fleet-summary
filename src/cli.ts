#!/usr/bin/env node
import { readFileSync, readdirSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { summarize } from "./summarize.js";
import { toMarkdown, toSummary } from "./format.js";
import type { AgentCard } from "./types.js";

type Format = "json" | "markdown" | "summary";

interface Args {
  dir?: string;
  format: Format;
  now?: string;
  failOnHigh: boolean;
  out?: string;
  help: boolean;
}

const FORMATS: Format[] = ["json", "markdown", "summary"];

function parseArgs(argv: string[]): Args {
  const args: Args = { format: "json", failOnHigh: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") args.help = true;
    else if (a === "--format") {
      const v = argv[++i] as Format;
      if (!FORMATS.includes(v)) throw new Error(`--format must be one of: ${FORMATS.join(", ")}`);
      args.format = v;
    } else if (a === "--now") args.now = argv[++i];
    else if (a === "--fail-on-high") args.failOnHigh = true;
    else if (a === "--out") args.out = argv[++i];
    else if (!a.startsWith("-")) args.dir = a;
    else throw new Error(`Unknown option: ${a}`);
  }
  return args;
}

const HELP = `agent-card-fleet-summary — fleet analyzer for A2A AgentCard documents

Usage:
  agent-card-fleet-summary <cards-dir>
      [--format json|markdown|summary]
      [--now <iso>]
      [--fail-on-high] [--out FILE]

Reads every *.json file in <cards-dir> as an AgentCard v0.1 document and emits
counts by autonomy_level / memory_persistence, plus findings:

  - autonomous-without-incident-response-uri (high)
  - no-evaluations-on-autonomous (high)
  - destructive-tool-on-non-autonomous (medium)
  - persistent-memory-without-refusal-taxonomy (medium)
  - empty-refusal-taxonomy (low)
  - no-evaluations (low)
  - missing-homepage (info)

Exit codes:
  0 — no high findings (or --fail-on-high not set)
  1 — high finding AND --fail-on-high set
  2 — usage / I/O error`;

function loadCards(dir: string): AgentCard[] {
  const out: AgentCard[] = [];
  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith(".json")) continue;
    const full = join(dir, entry);
    if (!statSync(full).isFile()) continue;
    out.push(JSON.parse(readFileSync(full, "utf8")) as AgentCard);
  }
  return out;
}

export function run(argv: string[]): number {
  let args: Args;
  try {
    args = parseArgs(argv);
  } catch (e) {
    process.stderr.write(`${(e as Error).message}\n`);
    return 2;
  }
  if (args.help || !args.dir) {
    process.stdout.write(`${HELP}\n`);
    return args.help ? 0 : 2;
  }

  let cards: AgentCard[];
  try {
    cards = loadCards(args.dir);
  } catch (e) {
    process.stderr.write(`error reading ${args.dir}: ${(e as Error).message}\n`);
    return 2;
  }

  const report = summarize(cards, args.now);
  let out: string;
  if (args.format === "json") out = JSON.stringify(report, null, 2);
  else if (args.format === "markdown") out = toMarkdown(report);
  else out = toSummary(report);

  if (args.out) writeFileSync(args.out, `${out}\n`, "utf8");
  else process.stdout.write(`${out}\n`);

  if (args.failOnHigh && !report.ok) return 1;
  return 0;
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  try {
    process.exit(run(process.argv.slice(2)));
  } catch (e) {
    process.stderr.write(`fatal: ${(e as Error).message}\n`);
    process.exit(2);
  }
}
