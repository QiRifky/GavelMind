import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getReport, judgeStatus, judgeTotal, finalsOf, summaryText, useApi, reportForEvent, type CheckResult, type Criterion, type Report, type SummaryStyle } from "@/lib/api";
import { AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, Check, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CriterionDeck } from "@/components/criterion-deck";
import { CardState, CardTitle, GlowCard } from "@/components/glow-card";
import { Badge } from "@/components/ui-bits";
import { WorkflowNav } from "@/components/workflow-nav";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/p/$id")({
  head: () => ({ meta: [{ title: "Project report — GavelMind" }, { name: "description", content: "Prepared material, AI draft scores and your final decisions for one project." }, { property: "og:title", content: "Project report — GavelMind" }, { property: "og:description", content: "Prepared material, AI draft scores and your final decisions for one project." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
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
  const report = load.k === "ok" ? reportForEvent(load.r, state.event) : null;
  useEffect(() => {
    let live = true;
    setLoad({ k: "loading" });
    getReport(id).then((r) => live && setLoad({ k: "ok", r }), (e: unknown) => live && setLoad({ k: "error", m: e instanceof Error ? e.message : "Couldn't load the report." }));
    return () => { live = false; };
  }, [id, stored, tick]);

  if (!project) return <div className="glass p-8 text-center"><p className="font-medium">Project not found.</p><Link to="/app/entries" className="mt-3 inline-block text-primary">Back to entries</Link></div>;

  return (
    <>
      <header className="mb-6 grid grid-cols-[minmax(0,1fr)] gap-3 sm:flex sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-2xl sm:text-3xl">{project.name}</h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <a href={project.repoUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Repository ↗</a>
            {project.demoUrl && <a href={project.demoUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Demo ↗</a>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="neutral">{judgeStatus(id, state)}</Badge>
        </div>
      </header>
      <WorkflowNav current="judging" />
      {load.k === "loading" && <div className="glass mt-6 p-6"><CardState kind="loading" /></div>}
      {load.k === "error" && <div className="glass mt-6 p-6"><CardState kind="error">{load.m}</CardState><Button variant="outline" className="mt-3 rounded-full" onClick={() => setTick((t) => t + 1)}>Retry</Button></div>}
      {report && <Bento key={project.id} r={report} criteria={state.criteria} />}
    </>
  );
}

function Bento({ r, criteria }: { r: Report; criteria: Criterion[] }) {
  const state = useApi();
  const finals = finalsOf(r.projectId, state);
  const decided = criteria.filter((c) => finals[c.id] !== undefined).length;
  const total = judgeTotal(finals, criteria);
  const projects = state.projects.filter((p) => p.status === "done" || p.id === r.projectId);
  const current = projects.findIndex((p) => p.id === r.projectId);
  const previous = projects[current - 1];
  const next = projects[current + 1];
  const reviewed = state.projects.filter((p) => judgeTotal(finalsOf(p.id, state), criteria) !== null).length;
  return (
    <div className="mt-6 space-y-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="font-mono text-xs uppercase text-primary">Judging workspace</p><h2 className="mt-2 text-2xl font-medium">Your evaluation</h2></div>
          <div className="text-right"><p className="font-mono text-lg tabular-nums">{decided}<span className="text-muted-foreground">/{criteria.length}</span></p><p className="text-xs text-muted-foreground">Criteria scored</p></div>
        </div>
        <div role="progressbar" aria-label="Review progress" aria-valuemin={0} aria-valuemax={criteria.length || 1} aria-valuenow={decided} className="flex h-1.5 gap-1.5">
          {criteria.map((c) => <span key={c.id} className={cn("flex-1 rounded-full", finals[c.id] !== undefined ? "bg-primary" : "bg-secondary")} />)}
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <ContextDeck r={r} />
      <section aria-label="Criterion evaluations" className="flex min-w-0 flex-col">
        {criteria.length === 0 && <CardState kind="empty">No criteria in the rubric yet.</CardState>}
        <CriterionDeck report={r} criteria={criteria} />
      </section>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
        <div><p className="text-xs text-muted-foreground">Judge's total · {state.finalized ? "final" : "draft, not final"}</p><p className="mt-1 font-mono text-lg tabular-nums">{total === null ? "Awaiting judge review" : `${total.toFixed(2)} / 10`}</p></div>
        <nav aria-label="Project navigation" className="flex flex-wrap gap-2">
          {previous ? <Button asChild variant="outline" className="rounded-full"><Link to="/app/p/$id" params={{ id: previous.id }}><ArrowLeft />Previous project</Link></Button> : <Button variant="outline" className="rounded-full" disabled><ArrowLeft />Previous project</Button>}
          {next ? <Button asChild className="rounded-full"><Link to="/app/p/$id" params={{ id: next.id }}>Next project<ArrowRight /></Link></Button> : <Button variant="outline" className="rounded-full" disabled>Next project<ArrowRight /></Button>}
          <Button asChild variant="ghost" className="rounded-full"><Link to="/app/results">{reviewed === state.projects.length ? "All scored · Continue to results" : "Continue to results"}<ArrowRight /></Link></Button>
        </nav>
      </footer>
    </div>
  );
}

function ContextDeck({ r }: { r: Report }) {
  const [tab, setTab] = useState<"summary" | "rules" | "material">("summary");
  const tabs = [{ id: "summary", label: "Summary" }, { id: "rules", label: "Rules check" }, { id: "material", label: "Evidence" }] as const;
  return (
    <section aria-label="Project context" className="flex min-w-0 flex-col gap-4">
      <div role="tablist" aria-label="Context cards" className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button key={t.id} type="button" role="tab" aria-selected={tab === t.id} variant={tab === t.id ? "default" : "outline"} className="rounded-full" onClick={() => setTab(t.id)}>{t.label}</Button>
        ))}
      </div>
      <div className="relative isolate flex flex-1 flex-col pb-8" aria-roledescription="card deck">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-5 top-0 bottom-0 rounded-card border border-border bg-card shadow-glass sm:inset-x-10" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-2.5 top-0 bottom-4 rounded-card border border-border bg-secondary shadow-glass sm:inset-x-5" />
        <div role="tabpanel" hidden={tab !== "summary"} className="criterion-deck-front relative z-10 flex-1 rounded-card bg-card [&>section]:h-full"><SummaryCard r={r} /></div>
        <div role="tabpanel" hidden={tab !== "rules"} className="criterion-deck-front relative z-10 flex-1 rounded-card bg-card [&>section]:h-full"><RulesCard r={r} /></div>
        <div role="tabpanel" hidden={tab !== "material"} className="criterion-deck-front relative z-10 flex-1 rounded-card bg-card [&>section]:h-full"><MaterialCard r={r} /></div>
      </div>
    </section>
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
      <div className="space-y-3 text-sm leading-relaxed">{summaryText(r, style).map((t) => <p key={t}>{t}</p>)}</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex h-full flex-col rounded-card bg-well p-4">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Check className="size-3.5 shrink-0 text-pass" />What it does</p>
          <p className="mt-2 text-sm leading-relaxed">{r.does}</p>
        </div>
        <div className="flex h-full flex-col rounded-card bg-well p-4">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Minus className="size-3.5 shrink-0" />What it does not do</p>
          <p className="mt-2 text-sm leading-relaxed">{r.doesNot}</p>
        </div>
      </div>
      <div className="mt-auto pt-4">
        <p className="font-mono text-[11px] uppercase text-muted-foreground">Stack</p>
        <div className="mt-2 flex flex-wrap gap-2">{r.stack.map((s) => <span key={s.name} className="rounded-full border border-border px-3 py-1 text-xs">{s.name} <span className="text-muted-foreground">· {s.kind}</span></span>)}</div>
      </div>
    </GlowCard>
  );
}

const resultBg: Record<CheckResult, string> = { pass: "bg-pass/12", warn: "bg-warn/12", fail: "bg-fail/12" };
const resultText: Record<CheckResult, string> = { pass: "text-pass", warn: "text-warn", fail: "text-fail" };
const resultLabel: Record<CheckResult, string> = { pass: "Pass", warn: "Warning", fail: "Fail" };

function RulesCard({ r }: { r: Report }) {
  const passed = r.checks.filter((c) => c.result === "pass").length;
  const pct = r.checks.length ? Math.round((passed / r.checks.length) * 100) : 0;
  return (
    <GlowCard accent="green" label="Rules check">
      <CardTitle accent="green" right={
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-1.5 w-14 overflow-hidden rounded-full bg-secondary"><span className="block h-full rounded-full bg-pass" style={{ width: `${pct}%` }} /></span>
          <span className="font-mono tabular-nums">{passed}/{r.checks.length} pass</span>
        </span>}>Rules check</CardTitle>
      <ul className="divide-y divide-border/60">
        {r.checks.map((c) => (
          <li key={c.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 py-3 first:pt-0 last:pb-0">
            <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full", resultBg[c.result])}>
              {c.result === "pass" ? <Check className="size-4" /> : c.result === "warn" ? <AlertTriangle className="size-4" /> : <X className="size-4" />}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-sm font-medium">{c.label}</p>
                <span className={cn("font-mono text-[11px] uppercase", resultText[c.result])}>{resultLabel[c.result]}</span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.reason}</p>
              <a href={c.evidenceUrl} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary hover:underline">{c.id.startsWith("event-") ? "Event source" : "Evidence"}<ArrowUpRight className="size-3" /></a>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-auto pt-4 text-xs text-muted-foreground">Checks read the collected material only. The judge makes the final decision.</p>
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
          <Button variant="ghost" key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("rounded-full px-3 py-1.5 text-sm", tab === t ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {t === "description" ? "Description" : t === "repository" ? "Repository" : "Demo video"}
          </Button>
        ))}
      </div>
      {tab === "description" && <div className="text-sm"><p>{m.description.text}</p><Source s={m.description.source} /></div>}
      {tab === "repository" && (
        <div className="space-y-3 text-sm">
          <div><p className="text-xs text-muted-foreground">README summary</p><p className="mt-1">{m.repository.readme}</p><Source s={m.repository.source} /></div>
          <div><p className="text-xs text-muted-foreground">Stack</p><p className="mt-1">{r.stack.map((s) => s.name).join(", ")}</p><Source s="package.json" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Sandbox run · <span className={m.repository.run.status === "worked" ? "text-pass" : m.repository.run.status === "error" ? "text-warn" : "text-fail"}>{m.repository.run.status}</span></p>
            <pre className="mt-2 max-h-56 overflow-auto rounded-card bg-well p-3 font-mono text-xs leading-relaxed">{m.repository.run.log.map((l, i) => <div key={i} className={logCls[l.type]}>{l.type === "cmd" ? "$ " : ""}{l.text}</div>)}</pre>
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
              <Button variant="link" className="px-0" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Hide transcript" : "Show transcript"}</Button>
              {open && <p className="mt-2 rounded-card bg-well p-3 text-muted-foreground">{m.demo.transcript}</p>}
            </div>
          )}
          <Source s={m.demo.source} />
        </div>
      )}
    </GlowCard>
  );
}

