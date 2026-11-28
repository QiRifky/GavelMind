import { useState } from "react";
import { Check, ChevronDown, Eraser, Scale, Sparkles, RotateCcw, Star, StarHalf, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { analyzeProject, average, draftsFor, saveJudgeScore, useApi, type Criterion, type Report } from "@/lib/api";
import { GlowCard } from "@/components/glow-card";
import { Button } from "@/components/ui/button";
import { HandoffBeam } from "@/components/ui/handoff-beam";

/** One criterion keeps the judge's decision beside its supporting AI material, with buttons to move through the rubric. */
export function CriterionEvaluation({ report, criterion, index, isFirst, isLast, onBack, onNext }: { report: Report; criterion: Criterion; index: number; isFirst: boolean; isLast: boolean; onBack: () => void; onNext: () => void }) {
  const state = useApi();
  const value = state.judge[report.projectId]?.[criterion.id];
  const [expanded, setExpanded] = useState(false);
  const [hoverScore, setHoverScore] = useState<number | null>(null);
  const drafts = draftsFor(report, criterion);
  const scores = drafts.flatMap((draft) => typeof draft.score === "number" && Number.isFinite(draft.score) && draft.score >= 1 && draft.score <= 10 ? [draft.score] : []);
  const suggested = scores.length ? Math.round(average(scores) * 2) / 2 : null;
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  async function refresh() {
    setRefreshing(true); setError("");
    try { await analyzeProject(report.projectId); }
    catch (e) { setError(e instanceof Error ? e.message : "Analysis failed. Try again."); }
    finally { setRefreshing(false); }
  }
  const detailsId = `models-${criterion.id}`;

  return (
    <GlowCard accent="orange" label={`${criterion.name} evaluation`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border font-mono text-sm text-primary">{String(index + 1).padStart(2, "0")}</span>
          <div className="min-w-0"><h3 className="break-words text-lg font-medium">{criterion.name}</h3><p className="text-xs text-muted-foreground">Weight {criterion.weight}%</p></div>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">{value?.score !== undefined && <Check className="size-4 text-primary" />}{value?.score !== undefined ? "Score saved" : "Awaiting your score"}</span>
      </div>
      <div className="grid gap-5">
        <HandoffBeam phase="idle" radius={0} className="min-w-0 pb-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground"><Sparkles className="size-4 text-primary" />AI recommendation</p>
            <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">Draft, not final</span>
          </div>
          {suggested !== null ? <p className="mt-3 font-mono text-3xl tabular-nums text-primary">{suggested}<span className="ml-1 text-sm text-muted-foreground">/10</span></p> : <Button type="button" variant="outline" size="sm" className="mt-3 h-auto min-h-9 rounded-full whitespace-normal" disabled={refreshing || state.finalized} onClick={() => void refresh()}><RotateCcw className={refreshing ? "animate-spin motion-reduce:animate-none" : ""} />{refreshing ? "Preparing recommendation…" : "Generate AI recommendation"}</Button>}
          {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
          <div className="mt-3 space-y-2 text-sm leading-relaxed">
            {Array.from(new Set(drafts.map((d) => d.reason))).map((reason) => <p key={reason}>{reason}</p>)}
          </div>
          <Button variant="ghost" size="sm" className="mt-3 rounded-full text-muted-foreground" aria-expanded={expanded} aria-controls={detailsId} onClick={() => setExpanded(!expanded)}>
            {expanded ? "Hide" : "View"} evidence <ChevronDown className={expanded ? "rotate-180" : ""} />
          </Button>
          {expanded && <div id={detailsId} className="mt-3 divide-y divide-border border-t border-border">
            {drafts.map((d) => <div key={d.model} className="py-3">
              <p className="break-words text-sm font-medium">{d.model}{d.score !== undefined && <span className="ml-2 font-mono text-primary">{d.score}/10 · draft</span>}</p>
              <p className="mt-2 break-words font-mono text-xs text-muted-foreground">Evidence: {d.evidence}</p>
            </div>)}
          </div>}
        </HandoffBeam>
        <div className="min-w-0 border-t border-border pt-5">
          <label htmlFor={`s-${criterion.id}`} className="flex items-center gap-2 text-sm font-medium"><Scale className="size-4 text-primary" />Judge's decision</label>
          <div className="mt-3 grid grid-cols-10 gap-0.5" role="group" aria-label={`${criterion.name} star rating`} onMouseLeave={() => setHoverScore(null)}>
            {Array.from({ length: 10 }, (_, i) => {
              const score = i + 1;
              const displayedScore = hoverScore ?? value?.score ?? 0;
              const filled = displayedScore >= score;
              const half = !filled && displayedScore >= score - 0.5;
              const Icon = half ? StarHalf : Star;
              return <Button key={score} type="button" variant="ghost" size="icon"
                className={`h-10 w-full rounded-full p-0 [&_svg]:size-5 ${filled || half ? "text-primary hover:text-primary" : "text-muted-foreground hover:text-primary"}`}
                aria-label={`${criterion.name}: ${score} out of 10`} aria-pressed={value?.score === score}
                title={`${score}/10`} disabled={state.finalized}
                onMouseEnter={() => setHoverScore(score)}
                onClick={() => saveJudgeScore(report.projectId, criterion.id, { score })}>
                <Icon className={filled || half ? "fill-current" : "fill-none"} aria-hidden="true" />
              </Button>;
            })}
          </div>
          <div className="relative mt-3">
            <input id={`s-${criterion.id}`} aria-label={`${criterion.name} final score`} type="number" min={0} max={10} step={0.5} disabled={state.finalized} value={value?.score ?? ""} placeholder="—"
              onChange={(e) => saveJudgeScore(report.projectId, criterion.id, { score: e.target.value === "" ? null : Number(e.target.value) })}
              className="h-14 w-full rounded-xl border border-border bg-well px-4 pr-16 font-mono text-2xl tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" />
            <span className="pointer-events-none absolute top-1/2 right-5 -translate-y-1/2 font-mono text-sm text-muted-foreground">/10</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className="h-auto min-h-9 rounded-full whitespace-normal" disabled={state.finalized || suggested === null} onClick={() => { if (suggested !== null) saveJudgeScore(report.projectId, criterion.id, { score: suggested }); }}><Sparkles />Use AI suggestion</Button>
            <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground" disabled={state.finalized || value?.score === undefined} onClick={() => saveJudgeScore(report.projectId, criterion.id, { score: null })}><Eraser />Clear</Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" size="sm" className="rounded-full" disabled={isFirst} onClick={onBack}><ArrowLeft />Back</Button>
            {isLast
              ? <Button asChild size="sm" className="rounded-full"><Link to="/app/results">Continue to results<ArrowRight /></Link></Button>
              : <Button size="sm" className="h-auto min-h-9 max-w-full rounded-full py-2 whitespace-normal" onClick={onNext}>Continue to next criterion<ArrowRight /></Button>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{state.finalized ? "Finalized · scores locked" : "Saved automatically · not final"}</p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">AI notes are suggestions to help you decide. The final decision is yours.</p>
        </div>
      </div>
    </GlowCard>
  );
}