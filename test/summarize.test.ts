import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { summarize } from "../src/summarize.js";
import { toMarkdown, toSummary } from "../src/format.js";
import type { AgentCard } from "../src/types.js";

const here = fileURLToPath(new URL(".", import.meta.url));
function loadDir(name: string): AgentCard[] {
  const dir = `${here}/../fixtures/${name}`;
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(`${dir}/${f}`, "utf8")) as AgentCard);
}

const NOW = "2026-05-27T08:00:00Z";

describe("summarize", () => {
  it("counts cards and groups by autonomy + memory", () => {
    const r = summarize(loadDir("cards"), NOW);
    expect(r.cards).toBe(2);
    expect(r.byAutonomy.supervised).toBe(1);
    expect(r.byAutonomy.assistive).toBe(1);
    expect(r.byMemory.session).toBe(1);
    expect(r.byMemory.none).toBe(1);
  });

  it("tallies tool uses + destructive tools", () => {
    const r = summarize(loadDir("cards"), NOW);
    expect(r.totalToolUses).toBe(3);
    expect(r.totalDestructiveTools).toBe(0);
  });

  it("flags autonomous-without-incident-response-uri as high", () => {
    const r = summarize([...loadDir("cards"), ...loadDir("cards-with-risk")], NOW);
    const f = r.findings.find((x) => x.code === "autonomous-without-incident-response-uri");
    expect(f?.severity).toBe("high");
    expect(f?.subjectName).toBe("Reckless Agent");
  });

  it("flags no-evaluations-on-autonomous as high", () => {
    const r = summarize([...loadDir("cards"), ...loadDir("cards-with-risk")], NOW);
    expect(r.findings.find((x) => x.code === "no-evaluations-on-autonomous")?.severity).toBe("high");
  });

  it("flags destructive-tool-on-non-autonomous as medium", () => {
    const card = JSON.parse(JSON.stringify(loadDir("cards")[0])) as AgentCard;
    card.capabilities.tools = [{ name: "drop-cache", side_effects: "destructive" }];
    const r = summarize([card], NOW);
    expect(r.findings.find((x) => x.code === "destructive-tool-on-non-autonomous")?.severity).toBe("medium");
  });

  it("flags persistent-memory-without-refusal-taxonomy as medium", () => {
    const r = summarize(loadDir("cards-with-risk"), NOW);
    expect(r.findings.some((x) => x.code === "persistent-memory-without-refusal-taxonomy")).toBe(true);
  });

  it("flags empty-refusal-taxonomy as low", () => {
    const r = summarize(loadDir("cards-with-risk"), NOW);
    expect(r.findings.find((x) => x.code === "empty-refusal-taxonomy")?.severity).toBe("low");
  });

  it("flags missing-homepage as info", () => {
    const r = summarize(loadDir("cards-with-risk"), NOW);
    expect(r.findings.find((x) => x.code === "missing-homepage")?.severity).toBe("info");
  });

  it("ok=true on clean fixture", () => {
    const r = summarize(loadDir("cards"), NOW);
    expect(r.findings.filter((f) => f.severity === "high")).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("ok=false when high finding present", () => {
    const r = summarize([...loadDir("cards"), ...loadDir("cards-with-risk")], NOW);
    expect(r.ok).toBe(false);
  });

  it("sorts rows by id deterministically", () => {
    const r = summarize([...loadDir("cards")], NOW);
    expect(r.rows.map((x) => x.id)).toEqual([
      "research-assistant@1.0.0",
      "support-triage@0.9.0"
    ]);
  });

  it("skips malformed cards (no agent/capabilities)", () => {
    const r = summarize([{} as AgentCard, ...loadDir("cards")], NOW);
    expect(r.cards).toBe(2);
  });
});

describe("formatters", () => {
  it("toMarkdown ranks high first and renders the per-agent table", () => {
    const md = toMarkdown(summarize([...loadDir("cards"), ...loadDir("cards-with-risk")], NOW));
    expect(md).toContain("❌");
    expect(md).toContain("reckless-agent@0.1.0");
    expect(md.indexOf("🔴")).toBeLessThan(md.indexOf("🟠"));
  });

  it("toMarkdown renders ✅ + 'No findings.' on the clean fixture", () => {
    const card: AgentCard = {
      agent_card_version: "0.1",
      agent: { id: "c", name: "C", version: "1.0.0", provider: "x", description: "x", homepage: "https://x" },
      capabilities: {
        primary_purpose: "x",
        models_used: [{ model: "m" }],
        tools: [{ name: "t", side_effects: "read" }],
        max_context_tokens: 1000,
        memory_persistence: "session",
        autonomy_level: "supervised"
      },
      refusal_taxonomy: [{ category: "x", behavior: "refuse_and_explain" }],
      evaluations: [{ suite: "x", result_uri: "https://x", ran_at: NOW, passed: true }],
      deployment: { environment: "production" },
      safety_posture: { incident_response_uri: "https://x" }
    };
    const md = toMarkdown(summarize([card], NOW));
    expect(md).toContain("✅");
    expect(md).toContain("No findings.");
  });

  it("toSummary emits a one-liner", () => {
    const s = toSummary(summarize([...loadDir("cards"), ...loadDir("cards-with-risk")], NOW));
    expect(s).toMatch(/3 cards/);
    expect(s).toMatch(/1 autonomous/);
  });
});
