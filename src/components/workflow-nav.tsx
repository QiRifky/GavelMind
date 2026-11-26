import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Check, FolderOpen, Menu, X } from "lucide-react";
import logo from "@/assets/gavel-logo.png.asset.json";
import { folderName, judgeStatus, useApi, weightTotal } from "@/lib/api";
import { cn } from "@/lib/utils";

type Step = "event" | "entries" | "rubric" | "judging" | "results";

/** Existing setup order, with live store status rather than navigation locks. */
export function WorkflowNav({ current }: { current: Step }) {
  const state = useApi();
  const ready = state.projects.filter((p) => p.status === "done").length;
  const done = state.projects.filter((p) => p.status === "done");
  const reviewed = done.filter((p) => judgeStatus(p.id, state) !== "Not reviewed").length;
  const judgeTarget = done.find((p) => judgeStatus(p.id, state) === "Not reviewed") ?? done[0];
  const steps = [
    { id: "event", to: "/app/event", label: "Event", status: state.event?.confirmed ? "Rules confirmed" : "Rules pending", done: Boolean(state.event?.confirmed) },
    { id: "rubric", to: "/app/rubric", label: "Rubric", status: `${weightTotal(state.criteria)}% saved weight`, done: false },
    { id: "entries", to: "/app/entries", label: "Entries", status: `${ready}/${state.projects.length} ready`, done: state.projects.length > 0 && ready === state.projects.length },
    { id: "judging", to: judgeTarget ? "/app/p/$id" : "/app/entries", params: judgeTarget ? { id: judgeTarget.id } : undefined, label: "Judging", status: done.length === 0 ? "No entries ready" : `${reviewed}/${done.length} reviewed`, done: done.length > 0 && reviewed === done.length },
    { id: "results", to: "/app/results", label: "Results", status: state.finalized ? "Final" : "Draft, not final", done: state.finalized },
  ] as const;
  const active = state.folders.find((f) => f.id === state.activeFolderId);
  const [open, setOpen] = useState(false);
  const linkProps = (step: (typeof steps)[number]) => ({ to: step.to, params: "params" in step ? step.params : undefined }) as { to: "/app/entries" };
  return (
    <header className="sticky top-3 z-40 mt-3 mb-6">
      <nav aria-label="Event workflow" className="relative rounded-full border border-border bg-card/90 px-2 py-1.5 shadow-glass backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-base font-medium">
            <img src={logo.url} alt="" aria-hidden className="size-6 object-contain" />
            <span className="hidden sm:inline">GavelMind<span className="-ml-0.5 text-primary">.</span></span>
          </Link>
          <ul className="mx-auto hidden items-center gap-1 lg:flex">
            {steps.map((step, i) => (
              <li key={step.id}>
                <Link {...linkProps(step)} title={step.status} aria-current={current === step.id ? "step" : undefined} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring", current === step.id && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground")}>
                  <span className={cn("font-mono text-xs", step.done && current !== step.id && "text-pass")}>{step.done ? <Check className="size-3.5" aria-label="Complete" /> : `0${i + 1}`}</span>
                  {step.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/app" title="All event folders" className="ml-auto flex min-w-0 max-w-[45%] items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground lg:ml-0 lg:max-w-56">
            <FolderOpen className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="truncate">{active ? folderName(active, state) : "All folders"}</span>
          </Link>
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? "Close steps" : "Open steps"} className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-secondary lg:hidden">
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </nav>
      {open && (
        <ul className="absolute inset-x-0 top-full mt-2 grid gap-1 rounded-card border border-border bg-card p-2 shadow-glass lg:hidden">
          {steps.map((step, i) => (
            <li key={step.id}>
              <Link {...linkProps(step)} onClick={() => setOpen(false)} aria-current={current === step.id ? "step" : undefined} className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:bg-secondary", current === step.id && "bg-accent text-accent-foreground")}>
                <span className={cn("w-5 font-mono text-xs", step.done && "text-pass")}>{step.done ? <Check className="size-4" aria-label="Complete" /> : `0${i + 1}`}</span>
                <span className="text-sm font-medium">{step.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">{step.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
/** Scrollable body under the workflow header; on laptops the page itself never scrolls. */
export function StepBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("", className)}>{children}</div>;
}
