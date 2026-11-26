import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Check, ChevronDown, ExternalLink, FolderOpen, Menu, Trash2, X } from "lucide-react";
import { deleteFolder, folderName, folderStats, judgeStatus, switchFolder, useApi, weightTotal } from "@/lib/api";
import { cn } from "@/lib/utils";
import logo from "@/assets/gavel-logo.png.asset.json";

type Step = "event" | "entries" | "rubric" | "judging" | "results";
const EASE = [0.22, 1, 0.36, 1] as const;

/** Workflow navbar (expanding card): step pills plus a folder panel that grows the card open. */
export function WorkflowNav({ current }: { current: Step }) {
  const state = useApi();
  const [panel, setPanel] = useState<null | "folder" | "mobile">(null);
  const ref = useRef<HTMLDivElement>(null);
  const active = state.folders.find((f) => f.id === state.activeFolderId);
  const stats = folderStats(state.activeFolderId, state);
  const done = state.projects.filter((p) => p.status === "done");
  const reviewed = done.filter((p) => judgeStatus(p.id, state) !== "Not reviewed").length;
  const judgeTarget = done.find((p) => judgeStatus(p.id, state) === "Not reviewed") ?? done[0];
  const steps = [
    { id: "event", to: "/app/event", label: "Event", status: state.event?.confirmed ? "Rules confirmed" : "Rules pending", done: Boolean(state.event?.confirmed) },
    { id: "rubric", to: "/app/rubric", label: "Rubric", status: `${weightTotal(state.criteria)}% saved weight`, done: false },
    { id: "entries", to: "/app/entries", label: "Entries", status: `${done.length}/${state.projects.length} ready`, done: state.projects.length > 0 && done.length === state.projects.length },
    { id: "judging", to: judgeTarget ? "/app/p/$id" : "/app/entries", params: judgeTarget ? { id: judgeTarget.id } : undefined, label: "Judging", status: done.length === 0 ? "No entries ready" : `${reviewed}/${done.length} reviewed`, done: done.length > 0 && reviewed === done.length },
    { id: "results", to: "/app/results", label: "Results", status: state.finalized ? "Final" : "Draft, not final", done: state.finalized },
  ] as const;

  useEffect(() => {
    if (!panel) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setPanel(null); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPanel(null); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [panel]);

  const toggle = (p: "folder" | "mobile") => setPanel((c) => (c === p ? null : p));
  const linkProps = (s: (typeof steps)[number]) => ({ to: s.to, params: "params" in s ? s.params : undefined }) as { to: "/app/entries" };
  const mark = (s: (typeof steps)[number], i: number) => <span className={cn("font-mono text-xs", s.done ? "text-pass" : "text-muted-foreground")}>{s.done ? <Check className="size-3.5" aria-label="Complete" /> : `0${i + 1}`}</span>;
  const name = active ? folderName(active, state) : "Event folders";

  return (
    <MotionConfig reducedMotion="user">
      <motion.div ref={ref} layout transition={{ duration: 0.35, ease: EASE }} className="relative z-20 mb-4 overflow-hidden rounded-3xl border border-border bg-card shadow-glass">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2 text-lg font-medium">
            <img src={logo.url} alt="" aria-hidden className="size-6 object-contain" />
            <span className="hidden sm:inline">GavelMind<span className="-ml-0.5 text-primary">.</span></span>
          </Link>

          <nav aria-label="Event workflow" className="hidden items-center gap-1 lg:flex">
            {steps.map((s, i) => (
              <Link key={s.id} {...linkProps(s)} aria-current={current === s.id ? "step" : undefined} title={s.status} onClick={() => setPanel(null)}
                className={cn("flex items-center gap-2 rounded-full px-4 py-2 text-[15px] font-medium transition-colors", current === s.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground")}>
                {mark(s, i)}{s.label}
              </Link>
            ))}
          </nav>

          <div className="flex min-w-0 items-center gap-2">
            <button type="button" onClick={() => toggle("folder")} aria-expanded={panel === "folder"}
              className={cn("hidden min-w-0 max-w-56 items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors sm:flex", panel === "folder" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
              <FolderOpen className="size-4 shrink-0 text-primary" /><span className="truncate">{name}</span>
              <ChevronDown className={cn("size-3.5 shrink-0 transition-transform duration-300", panel === "folder" && "rotate-180")} />
            </button>
            <button type="button" onClick={() => toggle("mobile")} aria-expanded={panel === "mobile"} aria-label={panel === "mobile" ? "Close menu" : "Open menu"} className="flex items-center gap-2 rounded-full px-3 py-2 text-sm lg:hidden">
              <span className="text-muted-foreground">{steps.find((s) => s.id === current)?.label}</span>
              {panel === "mobile" ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {panel === "folder" && (
            <motion.div key="folder" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden">
              <FolderPanel name={name} stats={stats} steps={steps} current={current} linkProps={linkProps} close={() => setPanel(null)} />
            </motion.div>
          )}
          {panel === "mobile" && (
            <motion.div key="mobile" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden lg:hidden">
              <div className="flex flex-col gap-1 px-4 pb-4">
                {steps.map((s, i) => (
                  <Link key={s.id} {...linkProps(s)} onClick={() => setPanel(null)} aria-current={current === s.id ? "step" : undefined}
                    className={cn("grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center rounded-2xl px-3 py-3", current === s.id ? "bg-secondary" : "hover:bg-secondary/60")}>
                    {mark(s, i)}<span className="truncate font-medium">{s.label}</span><span className="text-xs text-muted-foreground">{s.status}</span>
                  </Link>
                ))}
                <button type="button" onClick={() => setPanel("folder")} className="mt-2 flex items-center justify-between rounded-2xl border border-border px-3 py-3 text-left text-sm">
                  <span className="flex min-w-0 items-center gap-2"><FolderOpen className="size-4 shrink-0 text-primary" /><span className="truncate">{name}</span></span><ChevronDown className="size-4 -rotate-90" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </MotionConfig>
  );
}

type Steps = ReadonlyArray<{ id: string; label: string; status: string; done: boolean }>;
function FolderPanel({ name, stats, steps, current, linkProps, close }: { name: string; stats: ReturnType<typeof folderStats>; steps: Steps; current: Step; linkProps: (s: never) => { to: "/app/entries" }; close: () => void }) {
  const state = useApi();
  const others = state.folders.filter((f) => f.id !== state.activeFolderId);
  const eyebrow = "w-fit rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground";
  return (
    <div className="grid gap-8 px-4 pb-6 pt-2 sm:px-6 md:grid-cols-3">
      <div className="flex flex-col gap-4">
        <span className={eyebrow}>This event</span>
        <p className="text-xl font-semibold">{name}</p>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>{stats.projects} projects · {stats.ready} ready</li>
          <li>{stats.confirmed ? `${state.event?.rules.filter((r) => r.enabled).length ?? 0} rules confirmed` : "Rules not confirmed"}</li>
          <li>{stats.finalized ? "Results final" : "Draft, not final"}</li>
        </ul>
        {state.event?.url ? <a href={state.event.url} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-1 text-sm text-primary hover:underline">Event guide <ExternalLink className="size-3" /></a> : <Link to="/app/event" onClick={close} className="text-sm text-primary hover:underline">Add event details</Link>}
      </div>
      <div className="flex flex-col gap-4">
        <span className={eyebrow}>Progress</span>
        <ul className="flex flex-col gap-3">
          {steps.map((s) => (
            <li key={s.id}><Link {...linkProps(s as never)} onClick={close} className={cn("flex items-baseline justify-between gap-3 text-lg font-semibold hover:text-primary", current === s.id && "underline underline-offset-4")}>{s.label}<span className={cn("text-xs font-normal", s.done ? "text-pass" : "text-muted-foreground")}>{s.status}</span></Link></li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-4">
        <span className={eyebrow}>Switch folder</span>
        <ul className="flex flex-col gap-3">
          {others.length === 0 && <li className="text-sm text-muted-foreground">No other folders yet.</li>}
          {others.map((f) => <li key={f.id}><button type="button" onClick={() => { switchFolder(f.id); close(); }} className="truncate text-left text-lg font-semibold hover:text-primary">{folderName(f, state)}</button></li>)}
        </ul>
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
          <Link to="/app" onClick={close} className="rounded-full border border-border bg-secondary px-5 py-2.5 text-sm font-semibold hover:bg-accent">All folders</Link>
          {state.folders.length > 1 && <button type="button" onClick={() => { if (window.confirm(`Delete "${name}" and all its projects and scores?`)) { deleteFolder(state.activeFolderId); close(); } }} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted-foreground hover:text-destructive"><Trash2 className="size-4" />Delete</button>}
        </div>
      </div>
    </div>
  );
}

/** Body under the workflow navbar; pages scroll normally. */
export function StepBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("", className)}>{children}</div>;
}
