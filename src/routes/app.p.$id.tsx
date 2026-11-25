import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { agreement, average, draftsFor, getReport, judgeStatus, judgeTotal, finalsOf, saveJudgeScore, summaryText, useApi, type CheckResult, type Criterion, type Report, type SummaryStyle } from "@/lib/api";
import { AnalyzeCard } from "@/components/analyze-card";
import { CardState, CardTitle, GlowCard } from "@/components/glow-card";
import { AiNotice, Badge } from "@/components/ui-bits";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/p/$id")({
  head: () => ({ meta: [{ title: "Project report — GavelMind" }, { name: "description", content: "Prepared material, AI draft scores and your final decisions for one project." }] }),
  component: ReportPage,
});

type Load = { k: "loading" } | { k: "error"; m: string } | { k: "ok"; r: Report };

function ReportPage() {
  const { id } = Route.useParams();
  const state = useApi();
  const project = state.projects.find((p) => p.id === id);
  const stored = state.reports[id];
  const [load, setLoad] = useState<Load>({ k: "loading" });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    setLoad({ k: "loading" });
    getReport(id).then((r) => live && setLoad({ k: "ok", r }), (e: unknown) => live && setLoad({ k: "error", m: e instanceof Error ? e.message : "Couldn't load the report." }));
    return () => { live = false; };
  }, [id, stored, tick]);

  if (!project) return <div className="glass p-8 text-center"><p className="font-medium">Project not found.</p><Link to="/app" className="mt-3 inline-block text-primary">Back to entries</Link></div>;

  return (
    <>
      <header className="mb-6 grid grid-cols-[minmax(0,1fr)] gap-3 sm:flex sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link to="/app" className="text-sm text-muted-foreground hover:text-foreground">← Entries</Link>
          <h1 className="mt-2 truncate text-[clamp(1.8rem,1rem+2vw,2.6rem)] tracking-[-0.03em]">{project.name}</h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <a href={project.repoUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Repository ↗</a>
            {project.demoUrl && <a href={project.demoUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Demo ↗</a>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={project.status === "done" ? "good" : project.status === "failed" ? "bad" : "accent"}>{project.status}</Badge>
          <Badge tone="neutral">{judgeStatus(id, state)}</Badge>
          <Badge tone={state.finalized ? "good" : "accent"}>{state.finalized ? "Final" : "Draft, not final"}</Badge>
        </div>
      </header>
      <AnalyzeCard key={project.repoUrl} initialUrl={project.repoUrl} className="mb-6" />
      <AiNotice />
      {load.k === "loading" && <div className="glass mt-6 p-6"><CardState kind="loading" /></div>}
      {load.k === "error" && <div className="glass mt-6 p-6"><CardState kind="error">{load.m}</CardState><button className="mt-3 text-sm text-primary underline" onClick={() => setTick((t) => t + 1)}>Retry</button></div>}
      {load.k === "ok" && <Bento r={load.r} criteria={state.criteria} />}
    </>
  );
}

function Bento({ r, criteria }: { r: Report; criteria: Criterion[] }) {
  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-3">
      <div className="grid gap-5 lg:col-span-2">
        <SummaryCard r={r} />
        <RulesCard r={r} />
        <MaterialCard r={r} />
        <DraftsCard r={r} criteria={criteria} />
        <BreakdownCard r={r} criteria={criteria} />
      </div>
      <div className="lg:sticky lg:top-20 lg:self-start"><JudgePanel r={r} criteria={criteria} /></div>
    </div>
  );
}

function SummaryCard({ r }: { r: Report }) {
  const [style, setStyle] = useState<SummaryStyle>("neutral");
  return (
    <GlowCard accent="orange" label="Summary">
      <CardTitle accent="orange" right={
        <select aria-label="Summary style" value={style} onChange={(e) => setStyle(e.target.value as SummaryStyle)} className="h-8 rounded-full border border-border bg-secondary px-3 text-xs">
          <option value="neutral">Neutral</option><option value="concise">Concise</option><option value="detailed">Detailed</option>
        </select>}>Summary</CardTitle>
      <div className="space-y-2 text-sm leading-relaxed">{summaryText(r, style).map((t) => <p key={t}>{t}</p>)}</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-well p-3 text-sm"><p className="text-xs text-muted-foreground">What it does</p><p className="mt-1">{r.does}</p></div>
        <div className="rounded-2xl bg-well p-3 text-sm"><p className="text-xs text-muted-foreground">What it does not do</p><p className="mt-1">{r.doesNot}</p></div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">{r.stack.map((s) => <span key={s.name} className="rounded-full border border-border px-3 py-1 text-xs">{s.name} <span className="text-muted-foreground">· {s.kind}</span></span>)}</div>
    </GlowCard>
  );
}

const resultCls: Record<CheckResult, string> = { pass: "bg-pass/15 text-pass", warn: "bg-warn/15 text-warn", fail: "bg-fail/15 text-fail" };
const resultLabel: Record<CheckResult, string> = { pass: "Pass", warn: "Warning", fail: "Fail" };

function RulesCard({ r }: { r: Report }) {
  return (
    <GlowCard accent="green" label="Rules check">
      <CardTitle accent="green" right={<span className="text-xs text-muted-foreground">{r.checks.filter((c) => c.result === "pass").length}/{r.checks.length} pass</span>}>Rules check</CardTitle>
      <ul className="space-y-3">
        {r.checks.map((c) => (
          <li key={c.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
            <span className={cn("mt-0.5 rounded-full px-2 py-0.5 text-xs font-medium", resultCls[c.result])}>{resultLabel[c.result]}</span>
            <div className="min-w-0 text-sm"><p className="font-medium">{c.label}</p><p className="text-muted-foreground">{c.reason} <a href={c.evidenceUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Evidence ↗</a></p></div>
          </li>
        ))}
      </ul>
    </GlowCard>
  );
}

const Source = ({ s }: { s: string }) => <p className="mt-2 font-mono text-[11px] text-muted-foreground">Source: {s}</p>;
const logCls = { cmd: "text-foreground", ok: "text-pass", info: "text-muted-foreground", warn: "text-warn", error: "text-fail", result: "text-primary" } as const;

function MaterialCard({ r }: { r: Report }) {
  const [tab, setTab] = useState<"description" | "repository" | "demo">("description");
  const [open, setOpen] = useState(false);
  const m = r.material;
  return (
    <GlowCard accent="amber" label="Collected material">
      <CardTitle accent="amber">Collected material</CardTitle>
      <div role="tablist" className="mb-4 flex flex-wrap gap-1">
        {(["description", "repository", "demo"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("rounded-full px-3 py-1.5 text-sm", tab === t ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {t === "description" ? "Description" : t === "repository" ? "Repository" : "Demo video"}
          </button>
        ))}
      </div>
      {tab === "description" && <div className="text-sm"><p>{m.description.text}</p><Source s={m.description.source} /></div>}
      {tab === "repository" && (
        <div className="space-y-3 text-sm">
          <div><p className="text-xs text-muted-foreground">README summary</p><p className="mt-1">{m.repository.readme}</p><Source s={m.repository.source} /></div>
          <div><p className="text-xs text-muted-foreground">Stack</p><p className="mt-1">{r.stack.map((s) => s.name).join(", ")}</p><Source s="package.json" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Sandbox run · <span className={m.repository.run.status === "worked" ? "text-pass" : m.repository.run.status === "error" ? "text-warn" : "text-fail"}>{m.repository.run.status}</span></p>
            <pre className="mt-2 max-h-56 overflow-auto rounded-2xl bg-well p-3 font-mono text-xs leading-relaxed">{m.repository.run.log.map((l, i) => <div key={i} className={logCls[l.type]}>{l.type === "cmd" ? "$ " : ""}{l.text}</div>)}</pre>
            <p className="mt-2 text-muted-foreground">{m.repository.run.evidence}</p><Source s="GavelMind sandbox" />
          </div>
        </div>
      )}
      {tab === "demo" && (
        <div className="text-sm">
          {m.demo.url ? <a href={m.demo.url} target="_blank" rel="noreferrer" className="break-all text-primary hover:underline">{m.demo.url}</a> : <p className="text-muted-foreground">No demo video provided.</p>}
          <p className="mt-2">Transcript: <span className="text-muted-foreground">{m.demo.transcriptStatus}</span></p>
          {m.demo.transcript && (
            <div className="mt-2">
              <button className="text-primary" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Hide transcript" : "Show transcript"}</button>
              {open && <p className="mt-2 rounded-2xl bg-well p-3 text-muted-foreground">{m.demo.transcript}</p>}
            </div>
          )}
          <Source s={m.demo.source} />
        </div>
      )}
    </GlowCard>
  );
}

function DraftsCard({ r, criteria }: { r: Report; criteria: Criterion[] }) {
  if (criteria.length === 0) return <GlowCard accent="rust" label="Draft scores"><CardState kind="empty">No criteria in the rubric yet.</CardState></GlowCard>;
  return (
    <GlowCard accent="rust" label="AI draft scores">
      <CardTitle accent="rust" right={<span className="text-xs text-muted-foreground">Suggestions only</span>}>AI draft scores</CardTitle>
      <div className="space-y-5">
        {criteria.map((c) => {
          const ds = draftsFor(r, c);
          const scores = ds.map((d) => d.score);
          const agree = agreement(scores);
          return (
            <div key={c.id}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{c.name}</p>
                <span className="font-mono text-sm text-primary">avg {average(scores)}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-xs", agree ? "bg-pass/15 text-pass" : "bg-warn/15 text-warn")}>{agree ? "Models agree" : "Models disagree"}</span>
              </div>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[28rem] text-sm">
                  <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1 pr-3 font-normal">Model</th><th className="py-1 pr-3 font-normal">Draft</th><th className="py-1 font-normal">Reason · evidence</th></tr></thead>
                  <tbody>
                    {ds.map((d) => (
                      <tr key={d.model} className="border-t border-border/60 align-top">
                        <td className="py-2 pr-3 whitespace-nowrap">{d.model}</td>
                        <td className="py-2 pr-3 font-mono">{d.score}</td>
                        <td className="py-2">{d.reason} <span className="font-mono text-xs text-muted-foreground">{d.evidence}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </GlowCard>
  );
}

function JudgePanel({ r, criteria }: { r: Report; criteria: Criterion[] }) {
  const { judge, finalized } = useApi();
  const mine = judge[r.projectId] ?? {};
  return (
    <section aria-label="Judge's decision" className="glass p-5">
      <p className="eyebrow font-mono">Judge's decision</p>
      <p className="mt-1 text-sm text-muted-foreground">{finalized ? "Results are final; scores are locked." : "Saved automatically."}</p>
      <div className="mt-4 space-y-4">
        {criteria.map((c) => {
          const draft = average(draftsFor(r, c).map((d) => d.score));
          const v = mine[c.id];
          return (
            <GlowCard key={c.id} accent="orange" label={`${c.name} final score`}>
              <div className="flex items-center justify-between gap-2">
                <label htmlFor={`s-${c.id}`} className="text-sm font-medium">{c.name}</label>
                <span className="text-xs text-muted-foreground">AI draft {draft}</span>
              </div>
              <input id={`s-${c.id}`} type="number" min={0} max={10} step={0.5} disabled={finalized} value={v?.score ?? ""} placeholder="0–10"
                onChange={(e) => saveJudgeScore(r.projectId, c.id, { score: e.target.value === "" ? null : Number(e.target.value) })}
                className="mt-2 h-10 w-full rounded-xl border border-border bg-well px-3 font-mono outline-hidden focus:border-primary" />
              <textarea aria-label={`${c.name} note`} disabled={finalized} defaultValue={v?.note ?? ""} placeholder="Note (optional)" rows={2}
                onBlur={(e) => saveJudgeScore(r.projectId, c.id, { note: e.target.value.trim() })}
                className="mt-2 w-full resize-y rounded-xl border border-border bg-well px-3 py-2 text-sm outline-hidden focus:border-primary" />
              <div className="mt-2 flex gap-2">
                <button disabled={finalized} onClick={() => saveJudgeScore(r.projectId, c.id, { score: Math.round(draft * 2) / 2 })} className="rounded-full border border-border px-3 py-1 text-xs hover:bg-secondary disabled:opacity-50">Use AI draft</button>
                <button disabled={finalized} onClick={() => saveJudgeScore(r.projectId, c.id, { score: null })} className="rounded-full px-3 py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50">Clear</button>
              </div>
            </GlowCard>
          );
        })}
      </div>
    </section>
  );
}

function BreakdownCard({ r, criteria }: { r: Report; criteria: Criterion[] }) {
  const state = useApi();
  const finals = finalsOf(r.projectId, state);
  const total = judgeTotal(finals, criteria);
  return (
    <GlowCard accent="orange" label="Scoring breakdown">
      <CardTitle accent="orange">Scoring breakdown</CardTitle>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[30rem] text-sm">
          <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1 font-normal">Criterion</th><th className="font-normal">Weight</th><th className="font-normal">AI draft</th><th className="font-normal">Judge final</th><th className="text-right font-normal">Contribution</th></tr></thead>
          <tbody>
            {criteria.map((c) => {
              const f = finals[c.id];
              return (
                <tr key={c.id} className="border-t border-border/60">
                  <td className="py-2">{c.name}</td><td className="font-mono">{c.weight}%</td>
                  <td className="font-mono text-muted-foreground">{average(draftsFor(r, c).map((d) => d.score))}</td>
                  <td className="font-mono">{f ?? "—"}</td>
                  <td className="text-right font-mono">{f === undefined ? "—" : ((f * c.weight) / 100).toFixed(2)}</td>
                </tr>
              );
            })}
            <tr className="border-t border-border"><td className="py-2 font-medium" colSpan={4}>Total (judge's scores only)</td><td className="text-right font-mono text-primary">{total === null ? "Awaiting judge review" : total.toFixed(2)}</td></tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Formula: for each criterion, multiply the judge's final score by its weight, add them up, and divide by the total weight. AI drafts are never part of the total.</p>
    </GlowCard>
  );
}
