import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { CriterionEvaluation } from "@/components/criterion-evaluation";
import { Button } from "@/components/ui/button";
import { finalsOf, useApi, type Criterion, type Report } from "@/lib/api";
import { cn } from "@/lib/utils";

/** Keep every form mounted so changing the front card preserves local notes and evidence. */
export function CriterionDeck({ report, criteria }: { report: Report; criteria: Criterion[] }) {
  const state = useApi();
  const [selectedId, setSelectedId] = useState(criteria[0]?.id);
  const selectedIndex = criteria.findIndex((criterion) => criterion.id === selectedId);
  const activeIndex = Math.max(0, selectedIndex);
  const active = criteria[activeIndex];
  const finals = finalsOf(report.projectId, state);
  if (!active) return null;

  const goTo = (index: number) => {
    const criterion = criteria[index];
    if (criterion) setSelectedId(criterion.id);
  };

  return (
    <div className="space-y-4">
      <nav aria-label="Criterion navigation" className="flex flex-wrap gap-2">
        {criteria.map((criterion, index) => (
          <Button key={criterion.id} type="button" variant={index === activeIndex ? "default" : "outline"}
            className="min-w-11 rounded-full" aria-label={`Review ${criterion.name}`}
            aria-current={index === activeIndex ? "step" : undefined} onClick={() => goTo(index)}>
            <span className="font-mono text-xs">{String(index + 1).padStart(2, "0")}</span>
            <span className="hidden sm:inline">{criterion.name}</span>
            {finals[criterion.id] !== undefined && <Check aria-label="Score saved" className="size-3.5" />}
          </Button>
        ))}
      </nav>
      <div className="relative isolate pb-8" aria-roledescription="card deck" aria-label="Criterion cards">
        {activeIndex + 2 < criteria.length && <div aria-hidden="true" className="pointer-events-none absolute inset-x-5 top-0 bottom-0 rounded-3xl border border-border bg-card shadow-glass sm:inset-x-10" />}
        {activeIndex + 1 < criteria.length && <div aria-hidden="true" className="pointer-events-none absolute inset-x-2.5 top-0 bottom-4 rounded-3xl border border-border bg-secondary shadow-glass sm:inset-x-5" />}
        {criteria.map((criterion, index) => (
          <div key={`${report.projectId}-${criterion.id}`} hidden={index !== activeIndex}
            className="criterion-deck-front relative z-10 min-h-[35rem] rounded-3xl bg-card md:min-h-[23rem]"
            role="group" aria-label={`Criterion ${index + 1} of ${criteria.length}: ${criterion.name}`}>
            <CriterionEvaluation report={report} criterion={criterion} index={index} />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" size="icon" className="shrink-0 rounded-full"
          aria-label="Previous criterion" title="Previous criterion" disabled={activeIndex === 0} onClick={() => goTo(activeIndex - 1)}>
          <ArrowLeft />
        </Button>
        <div className="min-w-0 text-center" aria-live="polite" aria-atomic="true">
          <p className="text-sm font-medium">{active.name}</p>
          <p className={cn("mt-1 font-mono text-xs", finals[active.id] !== undefined ? "text-primary" : "text-muted-foreground")}>
            {activeIndex + 1} / {criteria.length} · {finals[active.id] !== undefined ? "Score saved" : "Awaiting your score"}
          </p>
        </div>
        <Button type="button" variant="outline" size="icon" className="shrink-0 rounded-full"
          aria-label="Next criterion" title="Next criterion" disabled={activeIndex === criteria.length - 1} onClick={() => goTo(activeIndex + 1)}>
          <ArrowRight />
        </Button>
      </div>
    </div>
  );
}