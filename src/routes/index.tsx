import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { addDiscovered, addEntries, analyze, removeEntry, scanShowcase, useApi, type Discovered, type EntryStatus } from "@/lib/api";
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

const statusTone: Record<EntryStatus, "neutral" | "accent" | "good" | "bad"> = { queued: "neutral", collecting: "accent", analyzing: "accent", done: "good", failed: "bad" };

function Entries() {
  const { entries } = useApi();
  const [text, setText] = useState("");
  const pending = entries.some((e) => e.status === "queued" || e.status === "failed");
  return (
    <>
      <PageHead eyebrow="Step 1 · Entries" title={<>Add the projects. <span className="text-primary">You'll judge them.</span></>}>
        Paste one project URL per line (a GitHub repo or a showcase page), or scan a showcase page. GavelMind runs and reads each one, then prepares a report for you.
      </PageHead>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="glass flex flex-col p-5 sm:p-6">
          <label htmlFor="urls" className="eyebrow font-mono">Repo URLs</label>
          <textarea
            id="urls"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            placeholder={"https://github.com/team/project-one\nhttps://github.com/team/project-two"}
            className="mt-3 min-h-44 w-full flex-1 resize-y rounded-2xl border border-border bg-well p-4 font-mono text-sm leading-relaxed text-muted-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary"
          />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Pill variant="outline" size="lg" disabled={!text.trim()} onClick={() => { addEntries(text); setText(""); }}>Add to queue</Pill>
            <Pill size="lg" disabled={!pending && !text.trim()} onClick={() => { if (text.trim()) { addEntries(text); setText(""); } analyze(); }}>Analyze →</Pill>
          </div>
          <ShowcaseScan />
        </section>
        <section className="glass p-2 sm:p-3">
          <ul className="divide-y divide-border/70">
            {entries.map((e) => (
              <li key={e.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{e.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{e.url}</p>
                  <dl className="mt-1 grid gap-0.5 font-mono text-[11px] text-muted-foreground/80">
                    <div className="flex min-w-0 gap-2"><dt className="shrink-0">repo</dt><dd className="truncate">{e.repoUrl ?? "not found yet"}</dd></div>
                    {e.demoUrl && <div className="flex min-w-0 gap-2"><dt className="shrink-0">demo</dt><dd className="truncate">{e.demoUrl}</dd></div>}
                  </dl>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={statusTone[e.status]}>{e.status === "analyzing" || e.status === "collecting" ? `${e.status}…` : e.status}</Badge>
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

type Scan = { state: "idle" } | { state: "loading" } | { state: "error"; message: string } | { state: "ready"; found: Discovered[] };

function ShowcaseScan() {
  const [page, setPage] = useState("");
  const [scan, setScan] = useState<Scan>({ state: "idle" });
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const run = () => {
    setScan({ state: "loading" });
    scanShowcase(page).then(
      (found) => { setScan({ state: "ready", found }); setPicked(new Set(found.map((f) => f.sourceUrl))); },
      (e: unknown) => setScan({ state: "error", message: e instanceof Error ? e.message : "Scan failed" }),
    );
  };
  return (
    <div className="mt-6 border-t border-border pt-5">
      <label htmlFor="showcase" className="eyebrow font-mono">Scan showcase page</label>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (page.trim()) run(); }}>
        <input id="showcase" value={page} onChange={(e) => setPage(e.target.value)} placeholder="https://hackathon.example.com/showcase"
          className="h-11 min-w-0 flex-1 rounded-full border border-border bg-well px-4 font-mono text-sm outline-none focus:border-primary" />
        <Pill type="submit" variant="outline" size="lg" disabled={!page.trim() || scan.state === "loading"}>Scan</Pill>
      </form>
      <div className="mt-3" aria-live="polite">
        {scan.state === "loading" && <p className="text-sm text-muted-foreground">Scanning page…</p>}
        {scan.state === "error" && <p className="text-sm text-destructive">{scan.message}</p>}
        {scan.state === "ready" && (scan.found.length === 0 ? <p className="text-sm text-muted-foreground">No projects found on that page.</p> : (
          <>
            <ul className="divide-y divide-border/70 rounded-2xl border border-border bg-well">
              {scan.found.map((f) => (
                <li key={f.sourceUrl}>
                  <label className="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-start gap-3 px-3 py-2.5">
                    <input type="checkbox" className="mt-1 accent-primary" checked={picked.has(f.sourceUrl)}
                      onChange={(e) => setPicked((p) => { const n = new Set(p); if (e.target.checked) n.add(f.sourceUrl); else n.delete(f.sourceUrl); return n; })} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{f.name}</span>
                      <span className="block truncate font-mono text-[11px] text-muted-foreground">{f.repoUrl}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <Pill className="mt-3" disabled={picked.size === 0}
              onClick={() => { addDiscovered(scan.found.filter((f) => picked.has(f.sourceUrl))); setScan({ state: "idle" }); setPage(""); }}>
              Add selected ({picked.size})
            </Pill>
          </>
        ))}
      </div>
    </div>
  );
}
