import { useRef, useState } from "react";
import { analyzePreview, enqueuePreview, draftsFor, STAGES, useApi, type AnalyzeStage, type Report } from "@/lib/api";
import { HandoffBeam } from "@/components/ui/handoff-beam";
import { Pill } from "@/components/ui-bits";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Plus, RotateCcw, CheckCheck, Check } from "lucide-react";

type Phase = { k: "idle" } | { k: "running"; stage: AnalyzeStage } | { k: "done"; report: Report; name: string } | { k: "error"; message: string };

/** Input card → activity beam while analyzing → result summary. */
export function AnalyzeCard({ initialUrl = "", className, embedded = false }: { initialUrl?: string; className?: string; embedded?: boolean }) {
  const [url, setUrl] = useState(initialUrl);
  const [phase, setPhase] = useState<Phase>({ k: "idle" });
  const ctrl = useRef<AbortController | null>(null);

  async function run() {
    const u = url.trim();
    if (!u) return;
    const c = new AbortController();
    ctrl.current = c;
    setPhase({ k: "running", stage: 0 });
    try {
      const { project, report } = await analyzePreview(u, { signal: c.signal, onStage: (stage) => setPhase({ k: "running", stage }) });
      setPhase({ k: "done", report, name: project.name });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") setPhase({ k: "idle" });
      else setPhase({ k: "error", message: e instanceof Error ? e.message : "Analysis failed." });
    }
  }

  return (
    <HandoffBeam phase={phase.k === "running" ? "thinking" : "idle"} className={cn(!embedded && "glass", className)}>
    <section aria-label="Analyze a project" aria-live="polite" className={embedded ? "px-1 py-4" : "p-5 pb-8 sm:p-6 sm:pb-9"}>
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

      {phase.k === "done" && <Result key={phase.report.projectId} report={phase.report} name={phase.name} onAgain={() => setPhase({ k: "idle" })} />}

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
  const { criteria, projects } = useApi();
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const inQueue = added && projects.some((p) => p.id === report.projectId);
  const addToQueue = () => {
    try { enqueuePreview(report.projectId); setAdded(true); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't add this project."); }
  };
  const passed = report.checks.filter((c) => c.result === "pass").length;
  const notes = criteria.map((c) => ({ id: c.id, name: c.name, note: draftsFor(report, c)[0]?.reason }));
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
      <header className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:flex-wrap">
        <div className="min-w-0 flex-1"><p className="eyebrow font-mono">Analysis ready</p><h3 className="mt-2 break-words text-xl font-medium">{name}</h3><p className="mt-2 text-sm text-muted-foreground">Project description from the repository</p></div>
        <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs text-muted-foreground"><CheckCheck className="size-4" /><span><span className="font-mono text-foreground">{passed}/{report.checks.length}</span> checks passed · repository evidence</span></span>
      </header>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="bento p-5" aria-label="Project summary">
          <p className="text-xs font-medium uppercase text-muted-foreground">Summary</p>
          <div className="mt-3 space-y-2 text-sm leading-relaxed">{report.summary.map((s) => <p key={s}>{s}</p>)}</div>
          <p className="mt-4 text-xs font-medium uppercase text-muted-foreground">What it does</p>
          <p className="mt-2 text-sm leading-relaxed">{report.does}</p>
          <p className="mt-4 text-xs font-medium uppercase text-muted-foreground">Limitations & unknowns</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{report.doesNot}</p>
          {report.stack.length > 0 && <ul className="mt-4 flex flex-wrap gap-2">{report.stack.map((t) => <li key={t.name} className="rounded-full border border-border px-2.5 py-1 font-mono text-xs text-muted-foreground">{t.name}</li>)}</ul>}
        </section>
        <section className="bento p-5" aria-label="Notes per criterion">
          <p className="text-xs font-medium uppercase text-muted-foreground">Evidence notes per criterion</p>
          <ul className="mt-3 divide-y divide-border">{notes.map((n) => <li key={n.id} className="py-3 first:pt-0"><p className="text-sm font-medium">{n.name}</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{n.note ?? "No evidence found."}</p></li>)}</ul>
        </section>
      </div>
      <footer className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">AI notes are suggestions to help you decide. The final decision is yours.</p>
        <div className="flex flex-wrap gap-3">
          <Button className="h-auto min-h-10 max-w-full rounded-full px-5 py-2 whitespace-normal" disabled={inQueue} onClick={addToQueue}>{inQueue ? <Check /> : <Plus />}{inQueue ? "Added to project queue" : "Add to project queue"}</Button>
          <Button variant="outline" className="h-10 rounded-full px-5" onClick={onAgain}><RotateCcw />Analyze another</Button>
        </div>
        {error && <p role="alert" className="w-full text-sm text-destructive">{error}</p>}
      </footer>
    </div>
  );
}
