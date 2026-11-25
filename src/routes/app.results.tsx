import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { exportResults, finalize, finalsOf, judgeTotal, reopen, useApi, type ExportFormat } from "@/lib/api";
import { AiNotice, Badge, PageHead, Pill } from "@/components/ui-bits";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/app/results")({
  head: () => ({ meta: [{ title: "Results — GavelMind" }, { name: "description", content: "Leaderboard ranked only by the judge's final scores, export and change log." }, { property: "og:title", content: "Results — GavelMind" }, { property: "og:description", content: "Leaderboard ranked only by the judge's final scores, export and change log." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Results,
});

function download(format: ExportFormat) {
  const f = exportResults(format);
  const url = URL.createObjectURL(new Blob([f.content], { type: f.mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = f.filename;
  a.click();
  URL.revokeObjectURL(url);
}

function Results() {
  const state = useApi();
  const rows = state.projects.map((p) => ({ p, total: judgeTotal(finalsOf(p.id, state), state.criteria) }));
  const ranked = rows.filter((r) => r.total !== null).sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
  const waiting = rows.filter((r) => r.total === null);
  const [open, setOpen] = useState(false);
  const [winners, setWinners] = useState<Set<string>>(new Set());

  return (
    <>
      <PageHead eyebrow="Results" title="Ranked by your decisions only.">AI drafts never count here. A project is ranked once you've set a final score for every criterion.</PageHead>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Badge tone={state.finalized ? "good" : "accent"}>{state.finalized ? "Final" : "Draft, not final"}</Badge>
        {state.finalized ? <Pill variant="outline" onClick={reopen}>Reopen</Pill> : <Pill disabled={ranked.length === 0} onClick={() => { setWinners(new Set()); setOpen(true); }}>Finalize…</Pill>}
        <div className="flex flex-wrap gap-2 sm:ml-auto" role="group" aria-label="Export">
          <span className="self-center text-sm text-muted-foreground">Export</span>
          {(["csv", "json", "md"] as const).map((f) => <Pill key={f} variant="outline" onClick={() => download(f)}>{f === "md" ? "Markdown" : f.toUpperCase()}</Pill>)}
        </div>
      </div>
      <AiNotice />

      <section className="glass mt-5 p-3 sm:p-4" aria-label="Leaderboard">
        {rows.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No projects yet. <Link to="/app" className="text-primary">Add some</Link>.</p>}
        <ol className="divide-y divide-border/70">
          {ranked.map((r, i) => (
            <li key={r.p.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-2 py-3">
              <span className="w-8 font-mono text-muted-foreground">#{i + 1}</span>
              <Link to="/app/p/$id" params={{ id: r.p.id }} className="min-w-0 truncate font-medium hover:text-primary">{r.p.name}{state.winners.includes(r.p.id) && <span className="ml-2 text-xs text-primary">Winner (your pick)</span>}</Link>
              <span className="font-mono">{r.total?.toFixed(2)}</span>
            </li>
          ))}
          {waiting.map((r) => (
            <li key={r.p.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-2 py-3">
              <span className="w-8 font-mono text-muted-foreground">—</span>
              <Link to="/app/p/$id" params={{ id: r.p.id }} className="min-w-0 truncate hover:text-primary">{r.p.name}</Link>
              <span className="text-sm text-muted-foreground">Awaiting judge review</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="glass mt-6 p-5 sm:p-6" aria-label="Change log">
        <p className="eyebrow font-mono">Change log</p>
        {state.log.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No edits yet. Score changes, notes, rubric edits and finalizing appear here.</p> : (
          <ul className="mt-3 divide-y divide-border/70">
            {state.log.map((l) => (
              <li key={l.id} className="grid gap-1 py-2.5 text-sm sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:gap-3">
                <time className="font-mono text-xs text-muted-foreground" dateTime={new Date(l.at).toISOString()}>{new Date(l.at).toLocaleTimeString()}</time>
                <span className="min-w-0 truncate">{l.what}</span>
                <span className="font-mono text-xs"><span className="text-muted-foreground line-through">{l.oldValue}</span> → {l.newValue}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalize results</AlertDialogTitle>
            <AlertDialogDescription>Pick the winners yourself. GavelMind only records your choice and locks the scores.</AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="space-y-1">
            {ranked.map((r) => (
              <li key={r.p.id}><label className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-sm hover:bg-secondary">
                <input type="checkbox" className="size-4 accent-(--brand)" checked={winners.has(r.p.id)} onChange={() => setWinners((s) => { const n = new Set(s); if (n.has(r.p.id)) n.delete(r.p.id); else n.add(r.p.id); return n; })} />
                <span className="min-w-0 flex-1 truncate">{r.p.name}</span><span className="font-mono text-xs">{r.total?.toFixed(2)}</span>
              </label></li>
            ))}
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => finalize([...winners])}>Finalize</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
