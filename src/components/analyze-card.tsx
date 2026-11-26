import { Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { addProjects, analyzeProject, average, draftsFor, snapshot, STAGES, type AnalyzeStage, type Report } from "@/lib/api";
import { HandoffBeam } from "@/components/ui/handoff-beam";
import { Pill } from "@/components/ui-bits";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DonutBreakdown } from "@/components/ui/donut-breakdown";
import { ShinyButton } from "@/components/ui/shiny-button";
import { ArrowRight, RotateCcw, CheckCheck } from "lucide-react";

type Phase = { k: "idle" } | { k: "running"; stage: AnalyzeStage } | { k: "done"; report: Report; name: string } | { k: "error"; message: string };

/** Input card → activity beam while analyzing → result summary. */
export function AnalyzeCard({ initialUrl = "", className }: { initialUrl?: string; className?: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [phase, setPhase] = useState<Phase>({ k: "idle" });
  const ctrl = useRef<AbortController | null>(null);

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
    <HandoffBeam phase={phase.k === "running" ? "thinking" : "idle"} className={cn("glass", className)}>
    <section aria-label="Analyze a project" aria-live="polite" className="p-5 pb-8 sm:p-6 sm:pb-9">
      {phase.k === "idle" && (
        <form className="animate-in fade-in duration-300" onSubmit={(e) => { e.preventDefault(); void run(); }}>
          <label htmlFor="analyze-url" className="eyebrow font-mono">Project URL</label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input id="analyze-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/team/project"
              className="h-11 min-w-0 sm:flex-1 rounded-2xl border border-border bg-well px-4 font-mono text-sm outline-hidden transition placeholder:text-muted-foreground/60 focus:border-primary" />
            <ShinyButton label="Analyze →" type="submit" disabled={!url.trim()} />
          </div>
        </form>
      )}

      {phase.k === "running" && (
        <div className="flex flex-col items-center py-4 text-center animate-in fade-in zoom-in-90 duration-500">
            <div className="w-full max-w-sm">
              <div className="h-2 overflow-hidden rounded-full bg-well" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={phase.stage + 1}>
                <div className="h-full rounded-full bg-primary" style={{ width: `${((phase.stage + 1) / 4) * 100}%` }} />
              </div>
            </div>
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
    </HandoffBeam>
  );
}

function Result({ report, name, onAgain }: { report: Report; name: string; onAgain: () => void }) {
  const { criteria } = snapshot();
  const passed = report.checks.filter((c) => c.result === "pass").length;
  const w = criteria.reduce((a, c) => a + c.weight, 0) || 1;
  const draft = criteria.reduce((a, c) => a + average(draftsFor(report, c).map((d) => d.score)) * c.weight, 0) / w;
  const segments = criteria.map((criterion) => {
    const drafts = draftsFor(report, criterion);
    return { id: criterion.id, label: criterion.name, score: average(drafts.map((d) => d.score)), weight: criterion.weight, reason: drafts[0]?.reason ?? "No model evidence available." };
  });
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
      <header className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:flex-wrap">
        <div className="min-w-0 flex-1"><p className="eyebrow font-mono">Analysis ready</p><h3 className="mt-2 break-words text-xl font-medium">{name}</h3><p className="mt-2 text-sm text-muted-foreground">AI draft score breakdown</p></div>
        <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs text-muted-foreground"><CheckCheck className="size-4" /><span><span className="font-mono text-foreground">{passed}/{report.checks.length}</span> checks passed · mock</span></span>
      </header>
      <DonutBreakdown data={segments} total={draft} />
      <p className="mt-4 text-xs text-muted-foreground">Chart segments show weighted contributions to the AI draft total.</p>
      <footer className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">AI scores are suggestions to help you decide. The final decision is yours.</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="h-10 rounded-full px-5"><Link to="/app/p/$id" params={{ id: report.projectId }}>Open full report <ArrowRight /></Link></Button>
          <Button variant="outline" className="h-10 rounded-full px-5" onClick={onAgain}><RotateCcw />Analyze another</Button>
        </div>
      </footer>
    </div>
  );
}
