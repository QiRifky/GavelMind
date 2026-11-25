import { createFileRoute, Link } from "@tanstack/react-router";
import { judgeTotal, setFinalized, useApi } from "@/lib/api";
import { AiNotice, Badge, PageHead, Pill } from "@/components/ui-bits";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — GavelMind" },
      { name: "description", content: "Ranked only by the judge's final scores." },
      { property: "og:title", content: "Leaderboard — GavelMind" },
      { property: "og:description", content: "Ranked only by the judge's final scores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Leaderboard,
});

function Leaderboard() {
  const { entries, finals, criteria, finalized } = useApi();
  const done = entries.filter((e) => e.status === "done");
  const rows = done.map((e) => ({ e, total: judgeTotal(finals[e.id], criteria) }));
  const ranked = rows.filter((r) => r.total !== null).sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
  const waiting = rows.filter((r) => r.total === null);
  return (
    <>
      <PageHead eyebrow="Step 3 · Results" title="Ranked by your decisions only.">
        AI drafts never count here. A project appears in the ranking once you've set a final score for every criterion.
      </PageHead>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Badge tone={finalized ? "good" : "accent"}>{finalized ? "Final" : "Draft, not final"}</Badge>
        {finalized ? (
          <Pill variant="outline" onClick={() => setFinalized(false)}>Reopen for edits</Pill>
        ) : (
          <Pill variant="ink" disabled={ranked.length === 0} onClick={() => { if (confirm("Finalize results? Scores will be locked.")) setFinalized(true); }}>Finalize results</Pill>
        )}
      </div>
      <div className="mb-6"><AiNotice /></div>
      <section className="glass p-2 sm:p-3">
        <ol className="divide-y divide-border/70">
          {ranked.map((r, i) => (
            <li key={r.e.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3">
              <span className="text-2xl font-normal tabular-nums text-primary">{i + 1}</span>
              <Link to="/report/$id" params={{ id: r.e.id }} className="truncate font-medium hover:text-primary">{r.e.name}</Link>
              <span className="tabular-nums">{r.total?.toFixed(2)}</span>
            </li>
          ))}
          {waiting.map((r) => (
            <li key={r.e.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3">
              <span className="text-muted-foreground">—</span>
              <Link to="/report/$id" params={{ id: r.e.id }} className="truncate font-medium hover:text-primary">{r.e.name}</Link>
              <Badge tone="neutral">Awaiting judge review</Badge>
            </li>
          ))}
          {rows.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No analyzed entries yet.</li>}
        </ol>
      </section>
    </>
  );
}
