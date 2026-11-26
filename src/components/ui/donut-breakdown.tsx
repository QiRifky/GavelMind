import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DraftSegment {
  id: string;
  label: string;
  score: number;
  weight: number;
  reason: string;
}

const strokes = ["stroke-primary", "stroke-foreground", "stroke-muted-foreground", "stroke-accent-foreground"];
const dots = ["bg-primary", "bg-foreground", "bg-muted-foreground", "bg-accent-foreground"];

/** Segment areas represent weighted contributions, not independent scores. */
export function DonutBreakdown({ data, total }: { data: DraftSegment[]; total: number }) {
  const [active, setActive] = useState<string | null>(null);
  const selected = data.find((segment) => segment.id === active);
  const contributionTotal = data.reduce((sum, segment) => sum + segment.score * segment.weight, 0);
  let cumulative = 0;

  return (
    <div className="grid min-w-0 items-center gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
      <div className="relative mx-auto aspect-square w-full max-w-64">
        <svg viewBox="0 0 260 260" className="h-full w-full" role="img" aria-label="AI draft weighted contributions by criterion">
          <circle cx="130" cy="130" r="92" fill="none" className="stroke-well" strokeWidth="28" />
          {data.map((segment, index) => {
            const percent = contributionTotal > 0 ? segment.score * segment.weight / contributionTotal * 100 : 0;
            const start = cumulative;
            cumulative += percent;
            const length = Math.max(0, percent - 1.3);
            return <circle key={segment.id} cx="130" cy="130" r="92" pathLength="100" fill="none"
              className={cn(strokes[index % strokes.length], "transition-all duration-200 motion-reduce:transition-none")}
              strokeWidth={selected?.id === segment.id ? 34 : 28}
              strokeDasharray={`${length} ${100 - length}`} strokeDashoffset={-start}
              transform="rotate(-90 130 130)" opacity={!selected || selected.id === segment.id ? 1 : 0.25}
              onPointerEnter={() => setActive(segment.id)} />;
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 px-12 text-center" aria-live="polite">
          <span className="max-w-full break-words text-xs text-muted-foreground">{selected?.label ?? "AI draft total"}</span>
          <span className="font-mono text-4xl font-medium">{(selected?.score ?? total).toFixed(1)}<span className="ml-1 text-sm text-muted-foreground">/10</span></span>
          <span className="text-xs text-muted-foreground">{selected ? `${selected.weight}% rubric weight` : "Suggestion · not final"}</span>
        </div>
      </div>
      <div className="min-w-0">
        <div className="mb-2 flex justify-between px-3 text-xs text-muted-foreground"><span>Rubric criteria</span><span>AI draft /10</span></div>
        {data.map((segment, index) => (
          <Button key={segment.id} variant="ghost" aria-pressed={selected?.id === segment.id}
            onClick={() => setActive(segment.id)}
            onPointerEnter={() => setActive(segment.id)} onFocus={() => setActive(segment.id)}
            className={cn("h-auto min-h-20 w-full justify-start gap-3 whitespace-normal rounded-lg px-3 py-3 text-left", selected?.id === segment.id && "bg-well text-foreground")}>
            <span className={cn("size-2 shrink-0 rounded-sm", dots[index % dots.length])} />
            <span className="min-w-0 flex-1"><span className="block break-words text-sm">{segment.label}</span><span className="mt-1 line-clamp-2 block text-xs font-normal text-muted-foreground">{segment.reason}</span></span>
            <span className="shrink-0 text-right font-mono"><span className="block text-base">{segment.score.toFixed(1)}</span><span className="mt-1 block text-xs font-normal text-muted-foreground">{segment.weight}% wt.</span></span>
          </Button>
        ))}
        {data.length === 0 && <p className="p-3 text-sm text-muted-foreground">No rubric criteria configured.</p>}
        <Button variant="ghost" className="mt-2 h-10 w-full justify-between rounded-none border-t border-border text-xs text-muted-foreground" onClick={() => setActive(null)}>View draft total <ArrowUpRight /></Button>
      </div>
    </div>
  );
}