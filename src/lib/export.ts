// Builds export files in the browser from judge's final scores, rubric and change log only.
import { judgeTotal, type Criterion, type Entry, type LogItem } from "./api";

export const EXPORT_NOTE = "AI scores are drafts; final scores are the judge's decisions.";

export interface ExportInput {
  entries: Entry[];
  criteria: Criterion[];
  finals: Record<string, Record<string, number>>;
  log: LogItem[];
  finalized: boolean;
}

function rows(d: ExportInput) {
  const done = d.entries.filter((e) => e.status === "done").map((e) => ({ e, total: judgeTotal(d.finals[e.id], d.criteria) }));
  const ranked = done.filter((r) => r.total !== null).sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
  const waiting = done.filter((r) => r.total === null);
  return [
    ...ranked.map((r, i) => ({ rank: String(i + 1), ...r })),
    ...waiting.map((r) => ({ rank: "Awaiting judge review", ...r })),
  ];
}

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function toCsv(d: ExportInput): string {
  const head = ["rank", "project", "source", ...d.criteria.map((c) => `${c.name} (${c.weight}%)`), "judge total"];
  const lines = [`# ${EXPORT_NOTE}`, `# status: ${d.finalized ? "final" : "draft, not final"}`, head.map(csvCell).join(",")];
  for (const r of rows(d)) {
    const f = d.finals[r.e.id] ?? {};
    lines.push([r.rank, r.e.name, r.e.url, ...d.criteria.map((c) => (f[c.id] === undefined ? "" : String(f[c.id]))), r.total === null ? "" : r.total.toFixed(2)].map(csvCell).join(","));
  }
  lines.push("", "changed at,what,old value,new value");
  for (const l of d.log) lines.push([new Date(l.at).toISOString(), l.what, l.oldValue, l.newValue].map(csvCell).join(","));
  return lines.join("\n");
}

export function toJson(d: ExportInput): string {
  return JSON.stringify({
    note: EXPORT_NOTE,
    status: d.finalized ? "final" : "draft",
    rubric: d.criteria.map((c) => ({ name: c.name, weight: c.weight })),
    results: rows(d).map((r) => ({ rank: r.rank, project: r.e.name, source: r.e.url, finalScores: Object.fromEntries(d.criteria.map((c) => [c.name, d.finals[r.e.id]?.[c.id] ?? null])), judgeTotal: r.total })),
    changeLog: d.log.map((l) => ({ at: new Date(l.at).toISOString(), what: l.what, oldValue: l.oldValue, newValue: l.newValue })),
  }, null, 2);
}

export function toMarkdown(d: ExportInput): string {
  const out = [`# GavelMind results`, "", `> ${EXPORT_NOTE}`, "", `Status: ${d.finalized ? "Final" : "Draft, not final"}`, "", "## Rubric", ""];
  for (const c of d.criteria) out.push(`- ${c.name}: ${c.weight}%`);
  out.push("", "## Leaderboard", "", "| Rank | Project | Judge total |", "| --- | --- | --- |");
  for (const r of rows(d)) out.push(`| ${r.rank} | ${r.e.name} | ${r.total === null ? "—" : r.total.toFixed(2)} |`);
  out.push("", "## Change log", "");
  if (d.log.length === 0) out.push("No judge edits yet.");
  for (const l of d.log) out.push(`- ${new Date(l.at).toISOString()} — ${l.what}: ${l.oldValue} → ${l.newValue}`);
  return out.join("\n");
}

export function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
