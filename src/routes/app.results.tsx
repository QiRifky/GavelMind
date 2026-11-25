import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { exportResults, finalize, leaderboard, reopen, useApi, type ExportFormat } from "@/lib/api";
import { AiNotice, Badge, PageHead, Pill } from "@/components/ui-bits";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/app/results")({
  head: () => ({
    meta: [
      { title: "Results — GavelMind" },
      { name: "description", content: "Leaderboard ranked only by the judge's final scores, export and change log." },
      { property: "og:title", content: "Results — GavelMind" },
      { property: "og:description", content: "Leaderboard ranked only by the judge's final scores, export and change log." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
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
  const s = useApi();
  const { ranked, waiting } = leaderboard(s);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  return (
    <>
      <PageHead eyebrow="Step 3 · Results" title="Ranked by your decisions only.">
        AI drafts never count here. A project is ranked once you've set a final score for every criterion.
      </PageHead>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Badge tone={s.finalized ? "good" : "accent"}>{s.finalized ? "Final" : "Draft, not final"}</Badge>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Export
            <select aria-label="Export results" value="" onChange={(e) => { if (e.target.value) download(e.target.value as ExportFormat); }} className="h-10 rounded-full border border-border bg-secondary px-3 text-foreground">
              <option value="">Choose format…</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="md">Markdown</option>
            </select>
          </label>
          {s.finalized ? <Pill variant="outline" onClick={() => void reopen()}>Reopen for edits</Pill> : <Pill disabled={ranked.length === 0} onClick={() => { setPicked(new Set()); setOpen(true); }}>Finalize…</Pill>}
        </div>
      </div>
      <div className="mb-6"><AiNotice /></div>
      <section aria-label="Leaderboard" className="glass p-2 sm:p-3">
        <ol className="divide-y divide-border/70">
          {ranked.map((r, i) => (
            <li key={r.p.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3">
              <span className="text-2xl tabular-nums text-primary">{i + 1}</span>
              <div className="min-w-0"><Link to="/app/p/$id" params={{ id: r.p.id }} className="block truncate font-medium hover:text-primary">{r.p.name}</Link>{s.winners.includes(r.p.id) && s.finalized && <span className="text-xs text-pass">Winner (chosen by judge)</span>}</div>
              <span className="tabular-nums">{r.total?.toFixed(2)}</span>
            </li>
          ))}
          {waiting.map((r) => (
            <li key={r.p.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3">
              <span className="text-muted-foreground">—</span>
              <Link to="/app/p/$id" params={{ id: r.p.id }} className="truncate font-medium hover:text-primary">{r.p.name}</Link>
              <Badge tone="neutral">Awaiting judge review</Badge>
            </li>
          ))}
          {ranked.length + waiting.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No analyzed projects yet. <Link to="/app" className="text-primary">Add projects</Link></li>}
        </ol>
      </section>

      <section aria-label="Change log" className="mt-10">
        <h2 className="mb-4 text-xl font-normal">Change log</h2>
        <div className="glass p-2 sm:p-3">
          {s.log.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No edits yet. Score changes, notes, rubric edits and finalizing show up here.</p> : (
            <ul className="divide-y divide-border/70">
              {s.log.map((l) => (
                <li key={l.id} className="grid gap-1 px-3 py-3 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center sm:gap-3">
                  <time className="font-mono text-xs text-muted-foreground" dateTime={new Date(l.at).toISOString()}>{new Date(l.at).toLocaleString()}</time>
                  <span className="min-w-0 text-sm">{l.what}</span>
                  <span className="text-sm tabular-nums"><span className="text-muted-foreground line-through">{l.oldValue}</span> → {l.newValue}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="border-border bg-popover">
          <AlertDialogHeader>
            <AlertDialogTitle>Finalize results</AlertDialogTitle>
            <AlertDialogDescription>Pick the winners yourself. GavelMind only records your choice, and scores lock until you reopen.</AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="max-h-64 space-y-1 overflow-auto">
            {ranked.map((r) => (
              <li key={r.p.id}><label className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-secondary">
                <input type="checkbox" className="accent-(--brand)" checked={picked.has(r.p.id)} onChange={() => { const n = new Set(picked); if (n.has(r.p.id)) n.delete(r.p.id); else n.add(r.p.id); setPicked(n); }} />
                <span className="min-w-0 flex-1 truncate text-sm">{r.p.name}</span><span className="text-sm tabular-nums text-muted-foreground">{r.total?.toFixed(2)}</span>
              </label></li>
            ))}
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void finalize([...picked])}>Finalize{picked.size ? ` with ${picked.size} winner${picked.size > 1 ? "s" : ""}` : ""}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
