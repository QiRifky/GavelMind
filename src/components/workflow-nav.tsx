import type React from "react";
import { Link } from "@tanstack/react-router";
import { Check, ArrowRight } from "lucide-react";
import { useApi, weightTotal } from "@/lib/api";
import { cn } from "@/lib/utils";
import { EventFolders } from "@/components/event-folders";

type Step = "event" | "entries" | "rubric" | "results";

/** Existing setup order, with live store status rather than navigation locks. */
export function WorkflowNav({ current }: { current: Step }) {
  const state = useApi();
  const ready = state.projects.filter((p) => p.status === "done").length;
  const steps = [
    { id: "event", to: "/app/event", label: "Event", status: state.event?.confirmed ? "Rules confirmed" : "Rules pending", done: Boolean(state.event?.confirmed) },
    { id: "entries", to: "/app/entries", label: "Entries", status: `${ready}/${state.projects.length} ready`, done: state.projects.length > 0 && ready === state.projects.length },
    { id: "rubric", to: "/app/rubric", label: "Rubric", status: `${weightTotal(state.criteria)}% saved weight`, done: false },
    { id: "results", to: "/app/results", label: "Results", status: state.finalized ? "Final" : "Draft, not final", done: state.finalized },
  ] as const;
  return (
    <EventFolders>
    <nav aria-label="Event workflow" className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border p-2 sm:grid-cols-4">
      {steps.map((step, i) => (
        <Link key={step.id} to={step.to} aria-current={current === step.id ? "step" : undefined} className={cn("group flex min-w-0 items-start gap-2 rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring", current === step.id && "bg-accent text-accent-foreground")}>
          <span className={cn("mt-0.5 font-mono text-xs", step.done && "text-pass")}>{step.done ? <Check className="size-4" aria-label="Complete" /> : `0${i + 1}`}</span>
          <span className="min-w-0"><span className="flex items-center gap-2 text-sm font-medium">{step.label}{current === step.id && <ArrowRight className="size-3" aria-hidden="true" />}</span><span className="mt-0.5 block text-xs text-muted-foreground">{step.status}</span></span>
        </Link>
      ))}
    </nav>
    </EventFolders>
  );
}
/** Scrollable body under the workflow header; on laptops the page itself never scrolls. */
export function StepBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1", className)}>{children}</div>;
}
