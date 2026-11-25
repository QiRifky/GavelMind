import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ANALYZE_STAGES, addProjects, analyzeProject, draftTotal, snapshot, useApi } from "@/lib/api";
import { Pill } from "@/components/ui-bits";
import { cn } from "@/lib/utils";

type Phase = { kind: "idle" } | { kind: "running"; stage: number } | { kind: "done"; id: string } | { kind: "error"; message: string };

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    const on = () => setReduced(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** URL input that morphs into an analysis orb, then into a result summary. */
export function AnalyzeCard({ projectId, initialUrl = "" }: { projectId?: string; initialUrl?: string }) {
  const { criteria, reports, projects } = useApi();
  const [url, setUrl] = useState(initialUrl);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const ctrl = useRef<AbortController | null>(null);
  const target = useRef<string | null>(null);
  const reduced = useReducedMotion();
  useEffect(() => () => ctrl.current?.abort(), []);

  async function run() {
    const clean = url.trim();
    if (!clean) return;
    let id = projectId && projects.find((p) => p.id === projectId)?.repoUrl === clean ? projectId : undefined;
    id ??= snapshot().projects.find((p) => p.repoUrl === clean)?.id ?? addProjects(clean)[0];
    if (!id) return;
    target.current = id;
    ctrl.current = new AbortController();
    setPhase({ kind: "running", stage: 0 });
    try {
      await analyzeProject(id, { signal: ctrl.current.signal, onStage: (stage) => setPhase({ kind: "running", stage }) });
      setPhase({ kind: "done", id });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") setPhase({ kind: "idle" });
      else setPhase({ kind: "error", message: e instanceof Error ? e.message : "Analysis failed." });
    }
  }

  const shell = "glass relative overflow-hidden p-5 transition-[border-radius,padding] duration-500 sm:p-6";

  if (phase.kind === "running") {
    const s = ANALYZE_STAGES[phase.stage] ?? ANALYZE_STAGES[0];
    const progress = (phase.stage + 1) / ANALYZE_STAGES.length;
    return (
      <section aria-label="Analysis in progress" aria-live="polite" className={cn(shell, "flex flex-col items-center gap-5 py-8 text-center animate-in fade-in zoom-in-95 duration-500")}>
        {reduced ? (
          <div className="w-full max-w-sm">
            <div className="h-2 overflow-hidden rounded-full bg-well"><div className="h-full rounded-full bg-primary" style={{ width: `${progress * 100}%` }} /></div>
          </div>
        ) : (
          <div className="relative grid size-40 place-items-center">
            <div aria-hidden className="absolute inset-4 rounded-full animate-orb-breathe" style={{ background: "radial-gradient(circle at 40% 35%, rgba(var(--glow-ember),0.95), rgba(var(--glow-orange),0.55) 45%, transparent 72%)", boxShadow: "0 0 70px 10px rgba(var(--glow-orange),0.35)" }} />
            <div aria-hidden className="absolute inset-6 rounded-full animate-orb-spin" style={{ background: "conic-gradient(from 0deg, transparent 0 70%, rgba(255,255,255,0.35) 85%, transparent)" , maskImage: "radial-gradient(circle, transparent 55%, black 56%)" }} />
            <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
              <circle cx="50" cy="50" r="47" fill="none" stroke="var(--line)" strokeWidth="1.5" />
              <circle cx="50" cy="50" r="47" fill="none" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - progress} className="transition-[stroke-dashoffset] duration-700" />
            </svg>
          </div>
        )}
        <div className="min-h-14">
          <p key={s.label} className="text-lg font-medium animate-in fade-in duration-500">{s.label}</p>
          <p key={s.line} className="mt-1 text-sm text-muted-foreground animate-in fade-in duration-700">{s.line}</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">Step {phase.stage + 1} of {ANALYZE_STAGES.length}</p>
        </div>
        <Pill variant="outline" onClick={() => ctrl.current?.abort()}>Cancel</Pill>
      </section>
    );
  }

  if (phase.kind === "done") {
    const r = reports[phase.id];
    const p = projects.find((x) => x.id === phase.id);
    const passed = r?.checks.filter((c) => c.result === "pass").length ?? 0;
    const dt = draftTotal(r, criteria);
    return (
      <section aria-label="Analysis result" className={cn(shell, "animate-in fade-in slide-in-from-bottom-2 duration-500")}>
        <p className="eyebrow font-mono">Analysis ready</p>
        <h2 className="mt-2 truncate text-xl font-medium">{p?.name}</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-well p-3"><dt className="text-muted-foreground">Checks passed</dt><dd className="text-lg tabular-nums">{passed} / {r?.checks.length ?? 0}</dd></div>
          <div className="rounded-2xl bg-well p-3"><dt className="text-muted-foreground">AI draft total</dt><dd className="text-lg tabular-nums">{dt?.toFixed(1) ?? "—"} <span className="text-xs text-muted-foreground">suggestion</span></dd></div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/app/p/$id" params={{ id: phase.id }} className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground">Open full report →</Link>
          <Pill variant="outline" size="lg" onClick={() => { setPhase({ kind: "idle" }); if (!projectId) setUrl(""); }}>Analyze another</Pill>
        </div>
      </section>
    );
  }

  return (
    <form aria-label="Analyze a project" className={cn(shell, "animate-in fade-in duration-300")} onSubmit={(e) => { e.preventDefault(); void run(); }}>
      <label htmlFor={`an-${projectId ?? "new"}`} className="eyebrow font-mono">Project URL</label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input id={`an-${projectId ?? "new"}`} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/team/project" className="h-11 min-w-0 flex-1 rounded-full border border-border bg-well px-5 font-mono text-sm outline-hidden transition focus:border-primary" />
        <Pill size="lg" type="submit" disabled={!url.trim()}>Analyze →</Pill>
      </div>
      {phase.kind === "error" && (
        <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-fail/30 bg-fail/10 px-4 py-3 text-sm text-fail">
          {phase.message}
          <Pill variant="outline" type="button" onClick={() => void run()}>Retry</Pill>
        </div>
      )}
    </form>
  );
}
