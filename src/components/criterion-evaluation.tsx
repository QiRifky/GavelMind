import { useState } from "react";
import { Check, ChevronDown, Eraser, Scale } from "lucide-react";
import { agreement, average, draftsFor, saveJudgeScore, useApi, type Criterion, type Report } from "@/lib/api";
import { GlowCard } from "@/components/glow-card";
import { Button } from "@/components/ui/button";

/** One criterion keeps the judge's decision beside its supporting AI material. */
export function CriterionEvaluation({ report, criterion, index }: { report: Report; criterion: Criterion; index: number }) {
  const state = useApi();
  const value = state.judge[report.projectId]?.[criterion.id];
  const [note, setNote] = useState(value?.note ?? "");
  const [expanded, setExpanded] = useState(false);
  const drafts = draftsFor(report, criterion);
  const draft = average(drafts.map((d) => d.score));
  const agreed = agreement(drafts.map((d) => d.score));
  const detailsId = `models-${criterion.id}`;

  return (
    <GlowCard accent="orange" label={`${criterion.name} evaluation`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border font-mono text-sm text-primary">{String(index + 1).padStart(2, "0")}</span>
          <div><h3 className="text-lg font-medium">{criterion.name}</h3><p className="text-xs text-muted-foreground">Weight {criterion.weight}%</p></div>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">{value?.score !== undefined && <Check className="size-4 text-primary" />}{value?.score !== undefined ? "Score saved" : "Awaiting your score"}</span>
      </div>
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] md:gap-7">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">AI draft · suggestions only</p>
            <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">{agreed ? "Models agree" : "Models differ"}</span>
          </div>
          <p className="mt-3 font-mono text-3xl tabular-nums text-primary">{draft}<span className="ml-1 text-sm text-muted-foreground">/10</span></p>
          <div className="mt-3 space-y-2 text-sm leading-relaxed">
            {Array.from(new Set(drafts.map((d) => d.reason))).map((reason) => <p key={reason}>{reason}</p>)}
          </div>
          <Button variant="ghost" size="sm" className="mt-3 rounded-full text-muted-foreground" aria-expanded={expanded} aria-controls={detailsId} onClick={() => setExpanded(!expanded)}>
            {expanded ? "Hide" : "View"} model reasons & evidence <ChevronDown className={expanded ? "rotate-180" : ""} />
          </Button>
          {expanded && <div id={detailsId} className="mt-3 divide-y divide-border border-t border-border">
            {drafts.map((d) => <div key={d.model} className="py-3">
              <div className="flex items-center justify-between gap-3 text-sm"><p className="font-medium">{d.model}</p><span className="font-mono tabular-nums text-primary">{d.score}/10</span></div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{d.reason}</p>
              <p className="mt-2 break-words font-mono text-xs text-muted-foreground">Evidence: {d.evidence}</p>
            </div>)}
          </div>}
        </div>
        <div className="min-w-0 border-t border-border pt-5 md:border-t-0 md:border-l md:pt-0 md:pl-7">
          <label htmlFor={`s-${criterion.id}`} className="flex items-center gap-2 text-sm font-medium"><Scale className="size-4 text-primary" />Judge's decision</label>
          <div className="relative mt-3">
            <input id={`s-${criterion.id}`} aria-label={`${criterion.name} final score`} type="number" min={0} max={10} step={0.5} disabled={state.finalized} value={value?.score ?? ""} placeholder="—"
              onChange={(e) => saveJudgeScore(report.projectId, criterion.id, { score: e.target.value === "" ? null : Number(e.target.value) })}
              className="h-14 w-full rounded-xl border border-border bg-well px-4 pr-16 font-mono text-2xl tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" />
            <span className="pointer-events-none absolute top-1/2 right-5 -translate-y-1/2 font-mono text-sm text-muted-foreground">/10</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="rounded-full" disabled={state.finalized || drafts.length === 0} onClick={() => saveJudgeScore(report.projectId, criterion.id, { score: Math.round(draft * 2) / 2 })}>Use AI draft</Button>
            <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground" disabled={state.finalized || value?.score === undefined} onClick={() => saveJudgeScore(report.projectId, criterion.id, { score: null })}><Eraser />Clear</Button>
          </div>
          <label htmlFor={`note-${criterion.id}`} className="mt-4 block text-xs text-muted-foreground">Judge's note · optional</label>
          <textarea id={`note-${criterion.id}`} aria-label={`${criterion.name} note`} disabled={state.finalized} value={note} rows={2} onChange={(e) => setNote(e.target.value)} onBlur={() => saveJudgeScore(report.projectId, criterion.id, { note: note.trim() })}
            className="mt-2 w-full resize-y rounded-xl border border-border bg-well px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" />
          <p className="mt-1 text-xs text-muted-foreground">{state.finalized ? "Finalized · scores locked" : "Saved automatically · not final"}</p>
        </div>
      </div>
    </GlowCard>
  );
}