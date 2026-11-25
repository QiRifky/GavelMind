import { Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { addProjects, analyzeProject, average, draftsFor, snapshot, STAGES, type AnalyzeStage, type Report } from "@/lib/api";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Pill } from "@/components/ui-bits";
import { cn } from "@/lib/utils";

type Phase = { k: "idle" } | { k: "running"; stage: AnalyzeStage } | { k: "done"; report: Report; name: string } | { k: "error"; message: string };

/** Input card → glowing orb while analyzing → result summary. */
export function AnalyzeCard({ initialUrl = "", className }: { initialUrl?: string; className?: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [phase, setPhase] = useState<Phase>({ k: "idle" });
  const ctrl = useRef<AbortController | null>(null);
  const reduced = useReducedMotion();

  async function run() {
    const u = url.trim();
    if (!u) return;
    const existing = snapshot().projects.find((p) => p.repoUrl === u);
    const project = existing ?? addProjects([u])[0];
    if (!project) return;
    const c = new AbortController();
    ctrl.current = c;
    setPhase({ k: "running", stage: 0 });
    try {
      const report = await analyzeProject(project.id, { signal: c.signal, onStage: (stage) => setPhase({ k: "running", stage }) });
      setPhase({ k: "done", report, name: project.name });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") setPhase({ k: "idle" });
      else setPhase({ k: "error", message: e instanceof Error ? e.message : "Analysis failed." });
    }
  }

  return (
    <section aria-label="Analyze a project" aria-live="polite" className={cn("glass overflow-hidden p-5 sm:p-6", className)}>
      {phase.k === "idle" && (
        <form className="animate-in fade-in duration-300" onSubmit={(e) => { e.preventDefault(); void run(); }}>
          <label htmlFor="analyze-url" className="eyebrow font-mono">Project URL</label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input id="analyze-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/team/project"
              className="h-11 min-w-0 sm:flex-1 rounded-2xl border border-border bg-well px-4 font-mono text-sm outline-hidden transition placeholder:text-muted-foreground/60 focus:border-primary" />
            <Pill size="lg" type="submit" disabled={!url.trim()}>Analyze →</Pill>
          </div>
        </form>
      )}

      {phase.k === "running" && (
        <div className="flex flex-col items-center py-4 text-center animate-in fade-in zoom-in-90 duration-500">
          {reduced ? (
            <div className="w-full max-w-sm">
              <div className="h-2 overflow-hidden rounded-full bg-well" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={phase.stage + 1}>
                <div className="h-full rounded-full bg-primary" style={{ width: `${((phase.stage + 1) / 4) * 100}%` }} />
              </div>
            </div>
          ) : (
            <Orb stage={phase.stage} />
          )}
          <p key={phase.stage} className="mt-5 text-base font-medium animate-in fade-in duration-500">
            {STAGES[phase.stage].label} <span className="font-mono text-xs text-muted-foreground">{phase.stage + 1}/4</span>
          </p>
          <p key={`d${phase.stage}`} className="mt-1 max-w-sm text-sm text-muted-foreground animate-in fade-in duration-500">{STAGES[phase.stage].detail}</p>
          <Pill variant="outline" className="mt-5" onClick={() => ctrl.current?.abort()}>Cancel</Pill>
        </div>
      )}

      {phase.k === "done" && <Result report={phase.report} name={phase.name} onAgain={() => setPhase({ k: "idle" })} />}

      {phase.k === "error" && (
        <div className="animate-in fade-in duration-300">
          <p className="eyebrow font-mono text-fail!">Analysis failed</p>
          <p className="mt-2 text-sm">{phase.message}</p>
          <div className="mt-4 flex gap-3">
            <Pill onClick={() => void run()}>Retry</Pill>
            <Pill variant="outline" onClick={() => setPhase({ k: "idle" })}>Edit URL</Pill>
          </div>
        </div>
      )}
    </section>
  );
}

function Orb({ stage }: { stage: AnalyzeStage }) {
  const C = 2 * Math.PI * 78;
  return (
    <div className="relative size-44" aria-hidden>
      <div className="absolute inset-4 rounded-full animate-orb-breathe" style={{ background: "radial-gradient(circle at 40% 35%, rgba(var(--glow-ember), 0.95), rgba(var(--glow-orange), 0.55) 45%, transparent 72%)", filter: "blur(6px)" }} />
      <div className="absolute inset-6 rounded-full animate-orb-spin" style={{ background: "conic-gradient(from 0deg, transparent 0 70%, rgba(255,255,255,0.35) 85%, transparent 100%)", mixBlendMode: "overlay" }} />
      <div className="absolute inset-0 rounded-full" style={{ boxShadow: "0 0 70px 10px rgba(var(--glow-orange), 0.25)" }} />
      <svg viewBox="0 0 176 176" className="absolute inset-0 -rotate-90">
        <circle cx="88" cy="88" r="78" fill="none" stroke="var(--line)" strokeWidth="2" />
        <circle cx="88" cy="88" r="78" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - (stage + 1) / 4)} style={{ transition: "stroke-dashoffset 900ms ease" }} />
      </svg>
    </div>
  );
}

function Result({ report, name, onAgain }: { report: Report; name: string; onAgain: () => void }) {
  const { criteria } = snapshot();
  const passed = report.checks.filter((c) => c.result === "pass").length;
  const w = criteria.reduce((a, c) => a + c.weight, 0) || 1;
  const draft = criteria.reduce((a, c) => a + average(draftsFor(report, c).map((d) => d.score)) * c.weight, 0) / w;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <p className="eyebrow font-mono">Analysis ready</p>
      <h3 className="mt-2 truncate text-xl font-medium">{name}</h3>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-well p-3"><dt className="text-xs text-muted-foreground">Checks passed</dt><dd className="mt-1 font-mono text-lg">{passed}/{report.checks.length}</dd></div>
        <div className="rounded-2xl bg-well p-3"><dt className="text-xs text-muted-foreground">AI draft total (suggestion)</dt><dd className="mt-1 font-mono text-lg">{draft.toFixed(1)}<span className="text-xs text-muted-foreground"> /10</span></dd></div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link to="/app/p/$id" params={{ id: report.projectId }} className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground">Open full report →</Link>
        <Pill variant="outline" onClick={onAgain}>Analyze another</Pill>
      </div>
    </div>
  );
}
