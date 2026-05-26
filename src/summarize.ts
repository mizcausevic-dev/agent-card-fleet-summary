import type {
  AgentCard,
  AutonomyLevel,
  Finding,
  FleetReport,
  FleetSummaryRow,
  MemoryPersistence
} from "./types.js";

const AUTONOMY: AutonomyLevel[] = ["assistive", "supervised", "autonomous"];
const MEMORY: MemoryPersistence[] = ["none", "session", "persistent"];

function emptyAutonomyCounts(): Record<AutonomyLevel, number> {
  return { assistive: 0, supervised: 0, autonomous: 0 };
}
function emptyMemoryCounts(): Record<MemoryPersistence, number> {
  return { none: 0, session: 0, persistent: 0 };
}

export function summarize(cards: AgentCard[], now?: string): FleetReport {
  const generatedAt = now ?? new Date().toISOString();
  const rows: FleetSummaryRow[] = [];
  const findings: Finding[] = [];
  const byAutonomy = emptyAutonomyCounts();
  const byMemory = emptyMemoryCounts();
  let totalDestructiveTools = 0;
  let totalToolUses = 0;

  for (const c of cards) {
    if (!c.agent || !c.capabilities) continue;
    const id = `${c.agent.id}@${c.agent.version}`;
    const tools = c.capabilities.tools ?? [];
    const destructive = tools.filter((t) => t.side_effects === "destructive").length;
    const refusalCount = c.refusal_taxonomy?.length ?? 0;
    const evalCount = c.evaluations?.length ?? 0;
    const hasIru = !!c.safety_posture?.incident_response_uri;

    if (AUTONOMY.includes(c.capabilities.autonomy_level)) byAutonomy[c.capabilities.autonomy_level] += 1;
    if (MEMORY.includes(c.capabilities.memory_persistence)) byMemory[c.capabilities.memory_persistence] += 1;
    totalDestructiveTools += destructive;
    totalToolUses += tools.length;

    rows.push({
      id,
      agentId: c.agent.id,
      version: c.agent.version,
      name: c.agent.name,
      autonomy: c.capabilities.autonomy_level,
      memory: c.capabilities.memory_persistence,
      toolCount: tools.length,
      destructiveTools: destructive,
      refusalCategories: refusalCount,
      evaluations: evalCount,
      hasIncidentResponseUri: hasIru
    });

    // ─── findings ──
    if (c.capabilities.autonomy_level === "autonomous" && !hasIru) {
      findings.push({
        code: "autonomous-without-incident-response-uri",
        severity: "high",
        message: `Autonomous agent has no safety_posture.incident_response_uri (spec requires it).`,
        subject: id,
        subjectName: c.agent.name
      });
    }
    if (c.capabilities.autonomy_level === "autonomous" && evalCount === 0) {
      findings.push({
        code: "no-evaluations-on-autonomous",
        severity: "high",
        message: `Autonomous agent has no evaluations recorded.`,
        subject: id,
        subjectName: c.agent.name
      });
    }
    if (destructive > 0 && c.capabilities.autonomy_level !== "autonomous") {
      findings.push({
        code: "destructive-tool-on-non-autonomous",
        severity: "medium",
        message: `${destructive} destructive tool(s) declared on a ${c.capabilities.autonomy_level} agent — confirm gating.`,
        subject: id,
        subjectName: c.agent.name
      });
    }
    if (c.capabilities.memory_persistence === "persistent" && refusalCount === 0) {
      findings.push({
        code: "persistent-memory-without-refusal-taxonomy",
        severity: "medium",
        message: `Persistent-memory agent has no refusal_taxonomy entries.`,
        subject: id,
        subjectName: c.agent.name
      });
    }
    if (refusalCount === 0) {
      findings.push({
        code: "empty-refusal-taxonomy",
        severity: "low",
        message: `Agent has no refusal_taxonomy entries.`,
        subject: id,
        subjectName: c.agent.name
      });
    }
    if (evalCount === 0 && c.capabilities.autonomy_level !== "autonomous") {
      findings.push({
        code: "no-evaluations",
        severity: "low",
        message: `No evaluations recorded.`,
        subject: id,
        subjectName: c.agent.name
      });
    }
    if (!c.agent.homepage) {
      findings.push({
        code: "missing-homepage",
        severity: "info",
        message: `agent.homepage is missing.`,
        subject: id,
        subjectName: c.agent.name
      });
    }
  }
  rows.sort((a, b) => a.id.localeCompare(b.id));

  const ok = !findings.some((f) => f.severity === "high");

  return {
    generatedAt,
    cards: rows.length,
    byAutonomy,
    byMemory,
    totalDestructiveTools,
    totalToolUses,
    rows,
    findings,
    ok
  };
}
