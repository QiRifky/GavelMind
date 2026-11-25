import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { addEntries, analyze, removeEntry, useApi, type EntryStatus } from "@/lib/api";
import { Badge, PageHead, Pill } from "@/components/ui-bits";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entries — GavelMind" },
      { name: "description", content: "Paste GitHub repos and let GavelMind prepare material for your review." },
      { property: "og:title", content: "Entries — GavelMind" },
      { property: "og:description", content: "Paste GitHub repos and let GavelMind prepare material for your review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Entries,
});

const statusTone: Record<EntryStatus, "neutral" | "accent" | "good" | "bad"> = { queued: "neutral", analyzing: "accent", done: "good", failed: "bad" };

function Entries() {
  const { entries } = useApi();
  const [text, setText] = useState("");
  const pending = entries.some((e) => e.status === "queued" || e.status === "failed");
  return (
    <>
      <PageHead eyebrow="Step 1 · Entries" title={<>Add the projects. <span className="text-primary">You'll judge them.</span></>}>
        Paste one GitHub repo URL per line. GavelMind runs and reads each one, then prepares a report for you.
      </PageHead>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="glass p-5 sm:p-6">
          <label htmlFor="urls" className="eyebrow">Repo URLs</label>
          <textarea id="urls" value={text} onChange={(e) => setText(e.target.value)} rows={6}
            placeholder={"https://github.com/team/project-one\nhttps://github.com/team/project-two"}
            className="mt-3 w-full rounded-2xl border border-border bg-background/60 p-3 font-mono text-sm outline-hidden focus:border-primary" />
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill variant="outline" disabled={!text.trim()} onClick={() => { addEntries(text); setText(""); }}>Add to queue</Pill>
            <Pill disabled={!pending && !text.trim()} onClick={() => { if (text.trim()) { addEntries(text); setText(""); } analyze(); }}>Analyze →</Pill>
          </div>
        </section>
        <section className="glass p-2 sm:p-3">
          <ul className="divide-y divide-border/70">
            {entries.map((e) => (
              <li key={e.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{e.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{e.url}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={statusTone[e.status]}>{e.status === "analyzing" ? "analyzing…" : e.status}</Badge>
                  {e.status === "done" ? (
                    <Link to="/report/$id" params={{ id: e.id }} className="rounded-full px-3 py-1 text-sm text-primary hover:bg-accent">Report</Link>
                  ) : (
                    <button onClick={() => removeEntry(e.id)} className="rounded-full px-2 py-1 text-sm text-muted-foreground hover:text-destructive" aria-label={`Remove ${e.name}`}>×</button>
                  )}
                </div>
              </li>
            ))}
            {entries.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No entries yet.</li>}
          </ul>
        </section>
      </div>
    </>
  );
}
