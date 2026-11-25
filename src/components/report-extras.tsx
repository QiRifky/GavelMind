import { useState, type ReactNode } from "react";
import { aggregate, modelDrafts, type Criterion, type Model, type Report } from "@/lib/api";
import { CardState, CardTitle } from "@/components/glow-card";
import { cn } from "@/lib/utils";

export type ReportLoad = { state: "loading" } | { state: "error"; message: string } | { state: "ready"; report: Report };

function Source({ children }: { children: ReactNode }) {
  return <p className="mt-2 truncate font-mono text-[11px] text-muted-foreground">source · {children}</p>;
}

/* Collected material: description, repository, demo video. */
export function MaterialTabs({ load }: { load: ReportLoad }) {
  const [tab, setTab] = useState<"description" | "repository" | "video">("description");
  const tabs = [["description", "Description"], ["repository", "Repository"], ["video", "Demo video"]] as const;
  return (
    <>
      <CardTitle accent="orange">Collected material</CardTitle>
      <div role="tablist" aria-label="Collected material" className="mb-4 flex flex-wrap gap-1 rounded-full bg-well p-1">
        {tabs.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={cn("h-8 rounded-full px-4 text-sm transition focus-visible:outline-2 focus-visible:outline-ring", tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{label}</button>
        ))}
      </div>
      {load.state === "loading" ? <CardState kind="loading" /> : load.state === "error" ? <CardState kind="error">{load.message}</CardState> : (() => {
        const { material: m, stack, run } = load.report;
        if (tab === "description")
          return m.description ? <div><p className="leading-relaxed">{m.description.text}</p><Source>{m.description.source}</Source></div>
            : <CardState kind="empty">No project description was found. The entry came straight from a repository.</CardState>;
        if (tab === "repository")
          return (
            <div className="space-y-4">
              <div><p className="text-xs uppercase tracking-wider text-muted-foreground">README summary</p><p className="mt-1">{m.repository.readme}</p><Source>{m.repository.source}</Source></div>
              <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Detected stack</p><p className="mt-1">{stack.map((s) => s.name).join(", ") || "None detected"}</p><Source>package files in the repository</Source></div>
              <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Sandbox run</p>
                <p className={cn("mt-1 font-medium", run.status === "worked" ? "text-pass" : run.status === "error" ? "text-warn" : "text-fail")}>{run.status}</p>
                <p className="text-sm text-muted-foreground">{run.evidence}</p><Source>sandbox run log</Source></div>
            </div>
          );
        const v = m.video;
        return (
          <div className="space-y-3">
            <p className="truncate">{v.url ? <a href={v.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{v.url}</a> : <span className="text-muted-foreground">No demo video provided.</span>}</p>
            <p className="text-sm">Transcript: <span className={cn("rounded-full px-2 py-0.5 text-xs", v.transcriptStatus === "ready" ? "bg-pass/12 text-pass" : v.transcriptStatus === "transcribing" ? "bg-warn/12 text-warn" : "bg-muted text-muted-foreground")}>{v.transcriptStatus}</span></p>
            {v.transcriptStatus === "ready" && v.transcript.length > 0 && (
              <details className="rounded-2xl bg-well p-3 text-sm">
                <summary className="cursor-pointer text-accent-foreground">Show transcript</summary>
                <ul className="mt-2 space-y-1 font-mono text-xs text-muted-foreground">{v.transcript.map((l) => <li key={l}>{l}</li>)}</ul>
              </details>
            )}
            <Source>{v.source}</Source>
          </div>
        );
      })()}
    </>
  );
}

/* Per-criterion draft from each model, aggregated draft and agreement. */
export function ModelTable({ load, id, criteria, models }: { load: ReportLoad; id: string; criteria: Criterion[]; models: Model[] }) {
  return (
    <>
      <CardTitle accent="amber">Multi-model drafts</CardTitle>
      {load.state === "loading" ? <CardState kind="loading" /> : load.state === "error" ? <CardState kind="error">{load.message}</CardState>
        : models.length === 0 ? <CardState kind="empty">No models returned drafts.</CardState>
        : criteria.length === 0 ? <CardState kind="empty">No rubric criteria.</CardState> : (
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground">
              <th className="px-2 py-2 font-normal">Criterion</th>
              {models.map((m) => <th key={m.id} className="px-2 py-2 font-normal">{m.name}</th>)}
              <th className="px-2 py-2 font-normal">AI draft (avg)</th>
              <th className="px-2 py-2 font-normal">Agreement</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {criteria.map((c) => {
                const ds = modelDrafts(id, c, models);
                const { avg, agree } = aggregate(ds.map((d) => d.score));
                return (
                  <tr key={c.id} className="align-top">
                    <td className="px-2 py-3 font-medium">{c.name}</td>
                    {ds.map((d) => (
                      <td key={d.modelId} className="px-2 py-3">
                        <details>
                          <summary className="cursor-pointer tabular-nums">{d.score}</summary>
                          <p className="mt-1 max-w-48 text-xs text-muted-foreground">{d.reason}</p>
                          <p className="mt-1 max-w-48 font-mono text-[11px] text-muted-foreground/80">evidence · {d.evidence}</p>
                        </details>
                      </td>
                    ))}
                    <td className="px-2 py-3 tabular-nums text-primary">{avg ?? "—"}</td>
                    <td className="px-2 py-3 tabular-nums"><span className={agree === ds.length ? "text-pass" : "text-warn"}>{agree} of {ds.length}</span> <span className="text-xs text-muted-foreground">within 1 pt</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 px-2 text-xs text-muted-foreground">Tap a score for its reason and evidence. These are drafts only.</p>
        </div>
      )}
    </>
  );
}

/* Transparent breakdown: only the judge's final scores make the total. */
export function Breakdown({ load, id, criteria, mine }: { load: ReportLoad; id: string; criteria: Criterion[]; mine: Record<string, number> }) {
  const wsum = criteria.reduce((s, c) => s + c.weight, 0);
  const rows = criteria.map((c) => {
    const { avg } = aggregate(modelDrafts(id, c).map((d) => d.score));
    const f = mine[c.id];
    return { c, pct: wsum ? (c.weight / wsum) * 100 : 0, avg, f, contrib: f === undefined || !wsum ? null : (f * c.weight) / wsum };
  });
  const complete = rows.length > 0 && rows.every((r) => r.contrib !== null);
  const total = complete ? rows.reduce((s, r) => s + (r.contrib ?? 0), 0) : null;
  return (
    <>
      <CardTitle accent="green">Scoring breakdown</CardTitle>
      {load.state === "loading" ? <CardState kind="loading" /> : load.state === "error" ? <CardState kind="error">{load.message}</CardState>
        : criteria.length === 0 ? <CardState kind="empty">No rubric criteria.</CardState> : (
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm tabular-nums">
            <thead><tr className="text-left text-xs text-muted-foreground">
              {["Criterion", "Weight", "AI draft", "Judge's final", "Contribution"].map((h) => <th key={h} className="px-2 py-2 font-normal">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.c.id}>
                  <td className="px-2 py-2.5 font-medium">{r.c.name}</td>
                  <td className="px-2 py-2.5">{r.pct.toFixed(0)}%</td>
                  <td className="px-2 py-2.5 text-muted-foreground">{r.avg ?? "—"}</td>
                  <td className="px-2 py-2.5">{r.f ?? "—"}</td>
                  <td className="px-2 py-2.5">{r.contrib === null ? "—" : r.contrib.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="font-medium"><td className="px-2 py-2.5" colSpan={3}>Total (judge)</td><td colSpan={2} className="px-2 py-2.5 text-right text-primary">{total === null ? "Awaiting judge review" : total.toFixed(2)}</td></tr>
            </tbody>
          </table>
          <p className="mt-3 px-2 text-xs text-muted-foreground">
            Contribution = judge's final score × weight ÷ total weight. Total = sum of contributions. AI drafts are shown for reference and never enter the total or the ranking.
          </p>
        </div>
      )}
    </>
  );
}
