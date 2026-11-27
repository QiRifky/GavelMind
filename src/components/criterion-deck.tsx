import { useState } from "react";
import { Check } from "lucide-react";
import { CriterionEvaluation } from "@/components/criterion-evaluation";
import { Button } from "@/components/ui/button";
import { finalsOf, useApi, type Criterion, type Report } from "@/lib/api";

/** Keep every form mounted so changing the front card preserves score and evidence state. */
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
    <div className="flex flex-1 flex-col gap-4">
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
      <div className="relative isolate flex flex-1 flex-col pb-8" aria-roledescription="card deck" aria-label="Criterion cards">
        {activeIndex + 2 < criteria.length && <div aria-hidden="true" className="pointer-events-none absolute inset-x-5 top-0 bottom-0 rounded-card border border-glass-rim bg-glass-card shadow-glass sm:inset-x-10" />}
        {activeIndex + 1 < criteria.length && <div aria-hidden="true" className="pointer-events-none absolute inset-x-2.5 top-0 bottom-4 rounded-card border border-glass-rim bg-glass-raised shadow-glass sm:inset-x-5" />}
        {criteria.map((criterion, index) => (
          <div key={`${report.projectId}-${criterion.id}`} hidden={index !== activeIndex}
            className="criterion-deck-front relative z-10 flex-1 rounded-card [&>section]:h-full"
            role="group" aria-label={`Criterion ${index + 1} of ${criteria.length}: ${criterion.name}`}>
            <CriterionEvaluation report={report} criterion={criterion} index={index} isFirst={index === 0} isLast={index === criteria.length - 1} onBack={() => goTo(index - 1)} onNext={() => goTo(index + 1)} />
          </div>
        ))}
      </div>
    </div>
  );
}