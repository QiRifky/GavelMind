import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { draftTotal, getReport, judgeStatusOf, judgeTotal, saveJudgeScore, useApi, type CheckResult, type Criterion, type CriterionDraft, type Report, type SummaryTone } from "@/lib/api";
import { AnalyzeCard } from "@/components/analyze-card";
import { CardState, CardTitle, GlowCard } from "@/components/glow-card";
import { AiNotice, Badge, Pill } from "@/components/ui-bits";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/p/$id")({
  head: () => ({
    meta: [
      { title: "Project report — GavelMind" },
      { name: "description", content: "Prepared material, AI draft scores and your final decision for one project." },
      { property: "og:title", content: "Project report — GavelMind" },
      { property: "og:description", content: "Prepared material, AI draft scores and your final decision for one project." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportPage,
});

const resultCls: Record<CheckResult, string> = { pass: "text-pass bg-pass/12", warning: "text-warn bg-warn/12", fail: "text-fail bg-fail/12" };

function ReportPage() {
  const { id } = Route.useParams();
  const s = useApi();
  const project = s.projects.find((p) => p.id === id);
  const q = useQuery({ queryKey: ["report", id], queryFn: () => getReport(id), retry: false });
  const report = s.reports[id] ?? q.data;

  if (!project) return <div className="glass p-8 text-center"><p className="font-medium">Project not found.</p><Link to="/app" className="mt-3 inline-block text-primary">Back to entries</Link></div>;
  const js = judgeStatusOf(s, id);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link to="/app" className="text-sm text-muted-foreground hover:text-foreground">← Entries</Link>
          <h1 className="mt-2 truncate text-[clamp(1.6rem,1rem+2vw,2.6rem)] font-normal tracking-[-0.03em]">{project.name}</h1>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <a href={project.repoUrl} target="_blank" rel="noreferrer" className="hover:text-primary">Repository ↗</a>
            {project.demoUrl && <a href={project.demoUrl} target="_blank" rel="noreferrer" className="hover:text-primary">Demo video ↗</a>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={project.status === "done" ? "good" : project.status === "failed" ? "bad" : "accent"}>{project.status}</Badge>
          <Badge tone={js === "Finalized" ? "good" : js === "In review" ? "accent" : "neutral"}>{js}</Badge>
        </div>
      </header>
      <AiNotice />
      <AnalyzeCard projectId={id} initialUrl={project.repoUrl} />
      {!report ? (
        <div className="glass p-6">{q.isPending ? <CardState kind="loading" /> : <CardState kind="error">{q.error instanceof Error ? q.error.message : "Report unavailable."}</CardState>}</div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <div className="grid gap-5 md:grid-cols-2">
            <SummaryCard r={report} />
            <ChecksCard r={report} />
            <div className="md:col-span-2"><MaterialCard r={report} /></div>
            <div className="md:col-span-2"><DraftsCard r={report} criteria={s.criteria} /></div>
            <div className="md:col-span-2"><Breakdown r={report} /></div>
          </div>
          <JudgePanel r={report} />
        </div>
      )}
    </div>
  );
}

function SummaryCard({ r }: { r: Report }) {
  const [tone, setTone] = useState<SummaryTone>("neutral");
  return (
    <GlowCard accent="orange" label="Summary">
      <CardTitle accent="orange" right={
        <div role="radiogroup" aria-label="Summary wording" className="flex rounded-full bg-well p-0.5 text-xs">
          {(["neutral", "concise", "detailed"] as const).map((t) => (
            <button key={t} role="radio" aria-checked={tone === t} onClick={() => setTone(t)} className={cn("rounded-full px-2.5 py-1 capitalize", tone === t ? "bg-secondary text-foreground" : "text-muted-foreground")}>{t}</button>
          ))}
        </div>
      }>Summary</CardTitle>
      <p className="text-sm leading-relaxed">{r.summary[tone].join(" ")}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">{r.stack.map((x) => <span key={x} className="rounded-full bg-well px-2.5 py-0.5 font-mono text-xs text-muted-foreground">{x}</span>)}</div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div><p className="text-xs text-pass">What it does</p><ul className="mt-1 space-y-1">{r.does.map((x) => <li key={x}>{x}</li>)}</ul></div>
        <div><p className="text-xs text-muted-foreground">What it does not do</p><ul className="mt-1 space-y-1 text-muted-foreground">{r.doesNot.map((x) => <li key={x}>{x}</li>)}</ul></div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Wording style only; scores don't change.</p>
    </GlowCard>
  );
}

function ChecksCard({ r }: { r: Report }) {
  return (
    <GlowCard accent="green" label="Rules check">
      <CardTitle accent="green" right={<span className="text-xs text-muted-foreground">{r.checks.filter((c) => c.result === "pass").length}/{r.checks.length} pass</span>}>Rules check</CardTitle>
      {r.checks.length === 0 ? <CardState kind="empty">No rules to check.</CardState> : (
        <ul className="space-y-3">
          {r.checks.map((c) => (
            <li key={c.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
              <span className={cn("mt-0.5 self-start rounded-full px-2 py-0.5 text-xs font-medium", resultCls[c.result])}>{c.result}</span>
              <div className="min-w-0 text-sm">
                <p className="font-medium">{c.label}</p>
                <p className="text-muted-foreground">{c.reason} <a href={c.evidenceUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Evidence ↗</a></p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </GlowCard>
  );
}

function Source({ children }: { children: string }) {
  return <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground">Source: {children}</span>;
}

function MaterialCard({ r }: { r: Report }) {
  const [tab, setTab] = useState<"desc" | "repo" | "demo">("desc");
  const m = r.material;
  const run = m.repository.run.value;
  return (
    <GlowCard accent="amber" label="Collected material">
      <CardTitle accent="amber">Collected material</CardTitle>
      <div role="tablist" className="mb-4 inline-flex self-start rounded-full bg-well p-1 text-sm">
        {([["desc", "Description"], ["repo", "Repository"], ["demo", "Demo video"]] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("rounded-full px-3 py-1", tab === k ? "bg-secondary text-foreground" : "text-muted-foreground")}>{l}</button>
        ))}
      </div>
      {tab === "desc" && <div className="space-y-2 text-sm"><p>{m.description.value}</p><Source>{m.description.source}</Source></div>}
      {tab === "repo" && (
        <div className="space-y-4 text-sm">
          <div className="space-y-1"><p className="text-xs text-muted-foreground">README summary</p><p>{m.repository.readme.value}</p><Source>{m.repository.readme.source}</Source></div>
          <div className="space-y-1"><p className="text-xs text-muted-foreground">Stack</p><p>{m.repository.stack.value.join(", ")}</p><Source>{m.repository.stack.source}</Source></div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Sandbox run: <span className={run.status === "worked" ? "text-pass" : run.status === "error" ? "text-warn" : "text-fail"}>{run.status}</span></p>
            <pre className="max-h-56 overflow-auto rounded-2xl bg-well p-4 font-mono text-xs leading-relaxed">
              {run.log.map((l, i) => <div key={i} className={cn(l.type === "ok" && "text-pass", l.type === "warn" && "text-warn", l.type === "error" && "text-fail", l.type === "cmd" && "text-primary", l.type === "info" && "text-muted-foreground", l.type === "result" && "font-medium")}>{l.type === "cmd" ? "$ " : ""}{l.text}</div>)}
            </pre>
            <Source>{m.repository.run.source}</Source>
          </div>
        </div>
      )}
      {tab === "demo" && (
        <div className="space-y-2 text-sm">
          {m.demo.url ? <a href={m.demo.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{m.demo.url}</a> : <p className="text-muted-foreground">No demo video was provided.</p>}
          <p>Transcript: <span className="text-muted-foreground">{m.demo.transcriptStatus}</span></p>
          {m.demo.transcript && <details className="rounded-2xl bg-well p-3"><summary className="cursor-pointer text-sm">Show transcript</summary><p className="mt-2 text-muted-foreground">{m.demo.transcript}</p></details>}
          <Source>{m.demo.source}</Source>
        </div>
      )}
    </GlowCard>
  );
}

function DraftsCard({ r, criteria }: { r: Report; criteria: Criterion[] }) {
  return (
    <GlowCard accent="rust" label="AI draft scores">
      <CardTitle accent="rust" right={<span className="text-xs text-muted-foreground">Suggestions only</span>}>AI draft scores</CardTitle>
      {r.drafts.length === 0 ? <CardState kind="empty">No criteria in the rubric yet.</CardState> : (
        <div className="space-y-4">
          {r.drafts.map((d) => <DraftBlock key={d.criterionId} d={d} name={criteria.find((c) => c.id === d.criterionId)?.name ?? "Criterion"} />)}
        </div>
      )}
    </GlowCard>
  );
}
function DraftBlock({ d, name }: { d: CriterionDraft; name: string }) {
  return (
    <div className="rounded-2xl bg-well p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">{name}</p>
        <div className="flex items-center gap-2 text-xs">
          <span className="tabular-nums">Draft avg <b className="text-sm font-medium">{d.average}</b></span>
          <span className={cn("rounded-full px-2 py-0.5", d.agree ? "bg-pass/12 text-pass" : "bg-warn/12 text-warn")}>{d.agree ? "Models agree" : "Models differ"}</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1 pr-3 font-normal">Model</th><th className="py-1 pr-3 font-normal">Draft</th><th className="py-1 font-normal">Reason and evidence</th></tr></thead>
          <tbody>
            {d.drafts.map((m) => (
              <tr key={m.model} className="border-t border-border/60 align-top">
                <td className="whitespace-nowrap py-1.5 pr-3">{m.model}</td>
                <td className="py-1.5 pr-3 tabular-nums">{m.score}</td>
                <td className="py-1.5">{m.reason} <span className="font-mono text-xs text-muted-foreground">{m.evidence}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function JudgePanel({ r }: { r: Report }) {
  const { criteria, finals, finalized } = useApi();
  const row = finals[r.projectId];
  const total = judgeTotal(row, criteria);
  return (
    <aside aria-label="Judge's decision" className="space-y-4 lg:sticky lg:top-20 lg:self-start">
      <div className="glass p-5">
        <p className="eyebrow font-mono">Judge's decision</p>
        <p className="mt-2 text-3xl tabular-nums">{total === null ? "—" : total.toFixed(2)}</p>
        <p className="text-sm text-muted-foreground">{total === null ? `${Object.keys(row ?? {}).length} of ${criteria.length} criteria decided` : "Your final total"}{finalized ? " · locked" : " · autosaved"}</p>
      </div>
      {criteria.map((c) => <JudgeCriterion key={c.id} c={c} r={r} />)}
    </aside>
  );
}

function JudgeCriterion({ c, r }: { c: Criterion; r: Report }) {
  const { finals, notes, finalized } = useApi();
  const saved = finals[r.projectId]?.[c.id];
  const savedNote = notes[r.projectId]?.[c.id] ?? "";
  const [val, setVal] = useState(saved === undefined ? "" : String(saved));
  const [note, setNote] = useState(savedNote);
  useEffect(() => setVal(saved === undefined ? "" : String(saved)), [saved]);
  useEffect(() => setNote(savedNote), [savedNote]);
  const draft = r.drafts.find((d) => d.criterionId === c.id);
  const commit = () => {
    if (val.trim() === "") return void saveJudgeScore(r.projectId, c.id, { score: null });
    const n = Number(val);
    if (Number.isFinite(n)) void saveJudgeScore(r.projectId, c.id, { score: n });
    else setVal(saved === undefined ? "" : String(saved));
  };
  return (
    <GlowCard accent="orange" label={`Final score for ${c.name}`} className="[&>div:last-child]:p-4">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={`f-${c.id}`} className="text-sm font-medium">{c.name} <span className="text-xs text-muted-foreground">{c.weight}%</span></label>
        <span className="text-xs text-muted-foreground">AI draft {draft?.average ?? "—"}</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input id={`f-${c.id}`} type="number" min={0} max={10} step={0.5} inputMode="decimal" disabled={finalized} value={val} onChange={(e) => setVal(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") commit(); }} placeholder="0–10" className="h-10 w-24 rounded-full border border-border bg-well px-3 text-center tabular-nums outline-hidden focus:border-primary" />
        <Pill variant="outline" className="h-9 px-3 text-xs" disabled={finalized || !draft} onClick={() => draft && void saveJudgeScore(r.projectId, c.id, { score: draft.average })}>Use AI draft</Pill>
        <Pill variant="outline" className="h-9 px-3 text-xs" disabled={finalized || saved === undefined} onClick={() => void saveJudgeScore(r.projectId, c.id, { score: null })}>Clear</Pill>
      </div>
      <textarea aria-label={`Note for ${c.name}`} disabled={finalized} value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => void saveJudgeScore(r.projectId, c.id, { note: note.trim() })} rows={2} placeholder="Optional note" className="mt-2 w-full resize-y rounded-2xl border border-border bg-well p-2.5 text-sm outline-hidden focus:border-primary" />
    </GlowCard>
  );
}

function Breakdown({ r }: { r: Report }) {
  const { criteria, finals } = useApi();
  const row = finals[r.projectId] ?? {};
  const total = judgeTotal(row, criteria);
  const dt = draftTotal(r, criteria);
  return (
    <GlowCard accent="green" label="Scoring breakdown">
      <CardTitle accent="green">Scoring breakdown</CardTitle>
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1.5 pr-3 font-normal">Criterion</th><th className="pr-3 font-normal">Weight</th><th className="pr-3 font-normal">AI draft</th><th className="pr-3 font-normal">Judge's final</th><th className="font-normal">Contribution</th></tr></thead>
          <tbody>
            {criteria.map((c) => {
              const f = row[c.id];
              return (
                <tr key={c.id} className="border-t border-border/60">
                  <td className="py-1.5 pr-3">{c.name}</td>
                  <td className="pr-3">{c.weight}%</td>
                  <td className="pr-3 text-muted-foreground">{r.drafts.find((d) => d.criterionId === c.id)?.average ?? "—"}</td>
                  <td className="pr-3">{f ?? "—"}</td>
                  <td>{f === undefined ? "—" : ((f * c.weight) / 100).toFixed(2)}</td>
                </tr>
              );
            })}
            <tr className="border-t border-border font-medium"><td className="py-2 pr-3">Total</td><td className="pr-3">100%</td><td className="pr-3 text-muted-foreground">{dt?.toFixed(2) ?? "—"}</td><td className="pr-3" /><td>{total === null ? "Awaiting judge review" : total.toFixed(2)}</td></tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Total = sum of (judge's final score × weight %) across all criteria. Only the judge's final scores count for ranking; the AI draft column is shown for reference.</p>
    </GlowCard>
  );
}
