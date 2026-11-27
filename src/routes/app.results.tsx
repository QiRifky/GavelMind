import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, ChevronDown, Copy, Download } from "lucide-react";
import { finalsOf, judgeStatus, judgeTotal, useApi } from "@/lib/api";
import { orderRows, resultsCsv, resultsSummary } from "@/lib/results";
import { StepBody, WorkflowNav } from "@/components/workflow-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FILTERS = [{ id: "all", label: "All" }, { id: "scored", label: "Scored" }, { id: "awaiting", label: "Awaiting" }] as const;
type Filter = (typeof FILTERS)[number]["id"];

export const Route = createFileRoute("/app/results")({
  validateSearch: (search: Record<string, unknown>): { show?: Filter } => {
    const v = search["show"];
    return v === "scored" || v === "awaiting" ? { show: v } : {};
  },
  head: () => ({ meta: [{ title: "Results — GavelMind" }, { name: "description", content: "Leaderboard ranked only by the judge's final scores." }, { property: "og:title", content: "Results — GavelMind" }, { property: "og:description", content: "Leaderboard ranked only by the judge's final scores." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Results,
});

const PODIUM = ["bg-primary/15 text-primary ring-primary/40", "bg-(--podium-silver)/15 text-(--podium-silver) ring-(--podium-silver)/40", "bg-(--podium-bronze)/15 text-(--podium-bronze) ring-(--podium-bronze)/40"];

function Results() {
  const state = useApi();
  const { show = "all" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const rows = orderRows(state.projects.map((p) => { const finals = finalsOf(p.id, state); return { p, name: p.name, finals, total: judgeTotal(finals, state.criteria) }; }));
  const scoredCount = rows.filter((r) => r.total !== null).length;
  const visible = rows.filter((r) => show === "all" || (show === "scored" ? r.total !== null : r.total === null));
  const done = state.projects.filter((p) => p.status === "done");
  const next = done.find((p) => judgeStatus(p.id, state) !== "Finalized" && judgeTotal(finalsOf(p.id, state), state.criteria) === null);
  const eventName = state.event?.name || state.folders.find((f) => f.id === state.activeFolderId)?.name || "Event";

  const exportCsv = () => {
    const blob = new Blob([resultsCsv(rows, state.criteria)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${eventName.replace(/[^\w-]+/g, "-").toLowerCase()}-results.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const copy = async () => {
    await navigator.clipboard.writeText(resultsSummary(eventName, rows));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  let rank = 0;
  return (
    <>
      <WorkflowNav current="results" />
      <StepBody className="flex flex-col gap-4">
        <section className="bento p-3 sm:p-4" aria-label="Leaderboard">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-2 pb-3">
            <p className="eyebrow min-w-0 truncate font-mono">Leaderboard · judge final scores</p>
            <div className="flex shrink-0 gap-1.5">
              <Button size="sm" variant="outline" className="rounded-full" onClick={exportCsv} disabled={rows.length === 0} aria-label="Export CSV"><Download /><span className="hidden sm:inline">Export CSV</span></Button>
              <Button size="sm" variant="outline" className="rounded-full" onClick={copy} disabled={rows.length === 0} aria-label="Copy summary">{copied ? <Check /> : <Copy />}<span className="hidden sm:inline">{copied ? "Copied" : "Copy summary"}</span></Button>
            </div>
          </div>
          <div role="tablist" aria-label="Filter" className="mx-2 mb-2 inline-flex gap-1 rounded-full border border-glass-rim p-1">
            {FILTERS.map((f) => {
              const n = f.id === "all" ? rows.length : f.id === "scored" ? scoredCount : rows.length - scoredCount;
              return (
                <button type="button" key={f.id} onClick={() => navigate({ to: ".", search: f.id === "all" ? {} : { show: f.id } })} role="tab" aria-selected={show === f.id} className={cn("rounded-full px-3 py-1 text-xs transition-colors", show === f.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  {f.label} <span className="font-mono opacity-70">{n}</span>
                </button>
              );
            })}
          </div>
          {rows.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No projects yet. <Link to="/app/entries" className="text-primary">Add some</Link>.</p>}
          {rows.length > 0 && visible.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Nothing here yet.</p>}
          <ol className="divide-y divide-border/70">
            {rows.map((r) => {
              const scored = r.total !== null;
              if (scored) rank++;
              if (!visible.includes(r)) return null;
              const isOpen = open === r.p.id;
              return (
                <li key={r.p.id} className="mx-1">
                  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-card px-3 py-3 transition-colors hover:bg-glass-inner">
                    {scored ? <span className={cn("grid size-8 place-items-center rounded-full font-mono text-sm", rank <= 3 ? `ring-1 ${PODIUM[rank - 1]}` : "text-muted-foreground")}>#{rank}</span> : <span className="w-8 text-center font-mono text-muted-foreground">—</span>}
                    {r.p.status === "done" ? <Link to="/app/p/$id" params={{ id: r.p.id }} className="min-w-0 truncate font-medium hover:text-primary">{r.p.name}{state.winners.includes(r.p.id) && <span className="ml-2 text-xs text-primary">Winner (your pick)</span>}</Link> : <Link to="/app/entries" className="min-w-0 truncate font-medium hover:text-primary">{r.p.name}{state.winners.includes(r.p.id) && <span className="ml-2 text-xs text-primary">Winner (your pick)</span>}</Link>}
                    {scored ? <span className="font-mono">{r.total!.toFixed(2)}</span> : <span className="max-w-32 text-right text-xs text-muted-foreground sm:max-w-none sm:text-sm">Awaiting judge review</span>}
                    {scored ? (
                      <Button size="icon" variant="ghost" className="size-8 rounded-full" aria-expanded={isOpen} aria-label={`Score breakdown for ${r.p.name}`} onClick={() => setOpen(isOpen ? null : r.p.id)}>
                        <ChevronDown className={cn("transition-transform", isOpen && "rotate-180")} />
                      </Button>
                    ) : <span className="size-8" />}
                  </div>
                  {scored && isOpen && (
                    <dl className="mx-3 mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {state.criteria.map((c) => (
                        <div key={c.id} className="bento rounded-xl px-3 py-2">
                          <dt className="truncate text-xs text-muted-foreground">{c.name} · {c.weight}%</dt>
                          <dd className="font-mono">{r.finals[c.id]}/10</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </li>
              );
            })}
          </ol>
          {next && (
            <div className="mt-3 flex justify-center px-2">
              <Button asChild className="rounded-full">
                <Link to="/app/p/$id" params={{ id: next.id }}>{scoredCount === 0 ? "Start judging" : `Continue judging (${scoredCount}/${rows.length} done)`}<ArrowRight /></Link>
              </Button>
            </div>
          )}
        </section>
      </StepBody>
    </>
  );
}
