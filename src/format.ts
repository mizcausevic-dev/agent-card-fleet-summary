import type { FindingSeverity, FleetReport } from "./types.js";

const SEVERITY_LABEL: Record<FindingSeverity, string> = {
  high: "🔴 high",
  medium: "🟠 medium",
  low: "🟡 low",
  info: "ℹ️  info"
};
const SEVERITY_RANK: Record<FindingSeverity, number> = { high: 0, medium: 1, low: 2, info: 3 };

export function toMarkdown(report: FleetReport): string {
  const lines: string[] = [];
  lines.push(report.ok ? `# Agent Card fleet summary ✅` : `# Agent Card fleet summary ❌`);
  lines.push(``);
  lines.push(`Generated: \`${report.generatedAt}\``);
  lines.push(``);
  lines.push(`## Fleet`);
  lines.push(``);
  lines.push(`- Cards: **${report.cards}** · Tool uses: ${report.totalToolUses} · Destructive tools: ${report.totalDestructiveTools}`);
  lines.push(`- Autonomy: assistive=${report.byAutonomy.assistive} · supervised=${report.byAutonomy.supervised} · autonomous=${report.byAutonomy.autonomous}`);
  lines.push(`- Memory: none=${report.byMemory.none} · session=${report.byMemory.session} · persistent=${report.byMemory.persistent}`);
  lines.push(``);
  lines.push(`## Per agent`);
  lines.push(``);
  lines.push(`| agent | autonomy | memory | tools | destructive | refusals | evals | IRU |`);
  lines.push(`|---|---|---|---:|---:|---:|---:|:---:|`);
  for (const r of report.rows) {
    lines.push(
      `| \`${r.id}\` | ${r.autonomy} | ${r.memory} | ${r.toolCount} | ${r.destructiveTools} | ${r.refusalCategories} | ${r.evaluations} | ${r.hasIncidentResponseUri ? "✓" : "—"} |`
    );
  }

  const ranked = [...report.findings].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
  );
  if (ranked.length > 0) {
    lines.push(``);
    lines.push(`## Findings (${ranked.length})`);
    lines.push(``);
    lines.push(`| severity | code | agent | message |`);
    lines.push(`|---|---|---|---|`);
    for (const f of ranked) {
      lines.push(
        `| ${SEVERITY_LABEL[f.severity]} | \`${f.code}\` | ${f.subjectName ?? f.subject} | ${f.message} |`
      );
    }
  } else {
    lines.push(``);
    lines.push(`No findings.`);
  }
  return lines.join("\n");
}

export function toSummary(report: FleetReport): string {
  const counts: Record<FindingSeverity, number> = { high: 0, medium: 0, low: 0, info: 0 };
  for (const f of report.findings) counts[f.severity] += 1;
  return `${report.cards} card${report.cards === 1 ? "" : "s"} · ${report.byAutonomy.autonomous} autonomous · ${report.totalDestructiveTools} destructive tools · ${counts.high} high · ${counts.medium} medium (${report.ok ? "ok" : "fail"})`;
}
