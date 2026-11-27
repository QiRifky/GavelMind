import { createFileRoute, Link } from "@tanstack/react-router";
import { finalsOf, judgeTotal, useApi } from "@/lib/api";
import { StepBody, WorkflowNav } from "@/components/workflow-nav";

export const Route = createFileRoute("/app/results")({
  head: () => ({ meta: [{ title: "Results — GavelMind" }, { name: "description", content: "Leaderboard ranked only by the judge's final scores." }, { property: "og:title", content: "Results — GavelMind" }, { property: "og:description", content: "Leaderboard ranked only by the judge's final scores." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Results,
});

function Results() {
  const state = useApi();
  const rows = state.projects.map((p) => ({ p, total: judgeTotal(finalsOf(p.id, state), state.criteria) }));
  const ranked = rows.filter((r) => r.total !== null).sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
  const waiting = rows.filter((r) => r.total === null);

  return (
    <>
      <WorkflowNav current="results" />
      <StepBody className="flex flex-col gap-4">
        <section className="bento p-3 sm:p-4" aria-label="Leaderboard">
          <p className="eyebrow px-2 pb-2 font-mono">Leaderboard · judge final scores</p>
          {rows.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No projects yet. <Link to="/app/entries" className="text-primary">Add some</Link>.</p>}
          <ol className="divide-y divide-border/70">
            {ranked.map((r, i) => (
              <li key={r.p.id} className="mx-1 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-card px-3 py-3 transition-colors hover:bg-glass-inner">
                <span className="w-8 font-mono text-muted-foreground">#{i + 1}</span>
                <Link to="/app/p/$id" params={{ id: r.p.id }} className="min-w-0 truncate font-medium hover:text-primary">{r.p.name}{state.winners.includes(r.p.id) && <span className="ml-2 text-xs text-primary">Winner (your pick)</span>}</Link>
                <span className="font-mono">{r.total?.toFixed(2)}</span>
              </li>
            ))}
            {waiting.map((r) => (
              <li key={r.p.id} className="mx-1 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-card px-3 py-3 transition-colors hover:bg-glass-inner">
                <span className="w-8 font-mono text-muted-foreground">—</span>
                {r.p.status === "done" ? <Link to="/app/p/$id" params={{ id: r.p.id }} className="min-w-0 truncate hover:text-primary">{r.p.name}</Link> : <Link to="/app/entries" className="min-w-0 truncate hover:text-primary">{r.p.name}</Link>}
                <span className="max-w-32 text-right text-xs text-muted-foreground sm:max-w-none sm:text-sm">Awaiting judge review</span>
              </li>
            ))}
          </ol>
        </section>
      </StepBody>
    </>
  );
}
