import type { Criterion } from "@/lib/api";

export interface ResultRow { name: string; total: number | null; finals: Record<string, number> }

/** Ranked first (judge totals, high to low), then awaiting rows. */
export function orderRows<T extends ResultRow>(rows: T[]): T[] {
  const ranked = rows.filter((r) => r.total !== null).sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
  return [...ranked, ...rows.filter((r) => r.total === null)];
}

const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** CSV of judge final scores only; unreviewed rows have no rank or total. */
export function resultsCsv(rows: ResultRow[], criteria: Criterion[]): string {
  const head = ["Rank", "Project", ...criteria.map((c) => c.name), "Judge total", "Status"];
  let rank = 0;
  const body = orderRows(rows).map((r) => {
    const scored = r.total !== null;
    if (scored) rank++;
    return [scored ? String(rank) : "", r.name, ...criteria.map((c) => (r.finals[c.id] !== undefined ? String(r.finals[c.id]) : "")), scored ? r.total!.toFixed(2) : "", scored ? "Judge scored" : "Awaiting judge review"];
  });
  return [head, ...body].map((l) => l.map(esc).join(",")).join("\n");
}

/** Plain-text recap for sharing; lists only judge-scored projects as ranked. */
export function resultsSummary(eventName: string, rows: ResultRow[]): string {
  const ordered = orderRows(rows);
  const ranked = ordered.filter((r) => r.total !== null);
  const waiting = ordered.length - ranked.length;
  const lines = [`${eventName} — judge final scores`];
  ranked.forEach((r, i) => lines.push(`${i + 1}. ${r.name} — ${r.total!.toFixed(2)}/10`));
  if (ranked.length === 0) lines.push("No projects scored by the judge yet.");
  if (waiting > 0) lines.push(`${waiting} awaiting judge review`);
  return lines.join("\n");
}
