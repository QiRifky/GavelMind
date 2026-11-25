import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { addProjects, analyzeProject, judgeStatus, removeProject, scanShowcase, splitUrls, useApi, type AnalysisStatus, type Discovered } from "@/lib/api";
import { AnalyzeCard } from "@/components/analyze-card";
import { Badge, PageHead, Pill } from "@/components/ui-bits";

const FILTERS = ["all", "queued", "analyzing", "done", "failed"] as const;

export const Route = createFileRoute("/app/")({
  validateSearch: (s: Record<string, unknown>): { q?: string; status?: string } => ({
    ...(typeof s["q"] === "string" && s["q"] ? { q: s["q"] } : {}),
    ...(typeof s["status"] === "string" && s["status"] !== "all" ? { status: s["status"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Entries — GavelMind" },
      { name: "description", content: "Add hackathon projects and let GavelMind prepare material for your review." },
      { property: "og:title", content: "Entries — GavelMind" },
      { property: "og:description", content: "Add hackathon projects and let GavelMind prepare material for your review." },
    ],
  }),
  component: Entries,
});

const tone: Record<AnalysisStatus, "neutral" | "accent" | "good" | "bad"> = { queued: "neutral", analyzing: "accent", done: "good", failed: "bad" };

function Entries() {
  const state = useApi();
  const { q = "", status = "all" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const needle = q.toLowerCase();
  const rows = state.projects.filter((p) => (status === "all" || p.status === status) && (!needle || p.name.toLowerCase().includes(needle) || p.repoUrl.toLowerCase().includes(needle)));
  const toggle = (id: string) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const analyzeSelected = () => {
    for (const id of picked) void analyzeProject(id, { stageMs: 600 }).catch(() => undefined);
    setPicked(new Set());
  };

  return (
    <>
      <PageHead eyebrow="Entries" title={<>Add the projects. <span className="text-primary">You'll judge them.</span></>}>
        GavelMind runs and reads each project, then prepares material and draft scores for your review.
      </PageHead>
      <AnalyzeCard className="mb-6" />
      <div className="grid gap-6 lg:grid-cols-2">
        <PasteCard />
        <ShowcaseCard />
      </div>

      <section className="glass mt-6 p-3 sm:p-4" aria-label="Projects">
        <div className="flex flex-col gap-3 p-2 sm:flex-row sm:items-center">
          <input type="search" value={q} onChange={(e) => void navigate({ to: ".", search: { ...(status !== "all" ? { status } : {}), ...(e.target.value ? { q: e.target.value } : {}) }, replace: true })} placeholder="Search projects" aria-label="Search projects"
            className="h-10 min-w-0 flex-1 rounded-full border border-border bg-well px-4 text-sm outline-hidden focus:border-primary" />
          <select value={status} onChange={(e) => void navigate({ to: ".", search: { ...(q ? { q } : {}), ...(e.target.value !== "all" ? { status: e.target.value } : {}) }, replace: true })} aria-label="Filter by status"
            className="h-10 rounded-full border border-border bg-secondary px-3 text-sm">
            {FILTERS.map((f) => <option key={f} value={f}>{f === "all" ? "All statuses" : f}</option>)}
          </select>
          <Pill disabled={picked.size === 0} onClick={analyzeSelected}>Analyze selected{picked.size ? ` (${picked.size})` : ""}</Pill>
        </div>
        {state.projects.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium">No projects yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Paste repo URLs above or scan a showcase page to start.</p>
          </div>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No projects match this search.</p>
        ) : (
          <ul className="divide-y divide-border/70">
            {rows.map((p) => (
              <li key={p.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-2 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                <input type="checkbox" checked={picked.has(p.id)} onChange={() => toggle(p.id)} disabled={p.status === "analyzing"} aria-label={`Select ${p.name}`} className="size-4 accent-(--brand)" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.repoUrl}</p>
                  {p.demoUrl && <p className="truncate text-xs text-muted-foreground">Demo: {p.demoUrl}</p>}
                </div>
                <div className="col-span-2 flex flex-wrap items-center gap-2 pl-7 sm:col-span-1 sm:pl-0">
                  <Badge tone={tone[p.status]}>{p.status === "analyzing" ? "analyzing…" : p.status}</Badge>
                  <Badge tone="neutral">{judgeStatus(p.id, state)}</Badge>
                  {p.status === "done" ? (
                    <Link to="/app/p/$id" params={{ id: p.id }} className="rounded-full px-3 py-1 text-sm text-primary hover:bg-accent">Report</Link>
                  ) : (
                    <button onClick={() => removeProject(p.id)} className="rounded-full px-2 py-1 text-sm text-muted-foreground hover:text-destructive" aria-label={`Remove ${p.name}`}>×</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function PasteCard() {
  const [text, setText] = useState("");
  const [added, setAdded] = useState<number | null>(null);
  return (
    <section className="glass flex flex-col p-5 sm:p-6" aria-label="Paste URLs">
      <label htmlFor="urls" className="eyebrow font-mono">Repo or project URLs</label>
      <textarea id="urls" value={text} onChange={(e) => setText(e.target.value)} rows={5}
        placeholder={"https://github.com/team/project-one\nhttps://github.com/team/project-two"}
        className="mt-3 min-h-32 w-full flex-1 resize-y rounded-2xl border border-border bg-well p-4 font-mono text-sm leading-relaxed outline-hidden placeholder:text-muted-foreground/60 focus:border-primary" />
      <div className="mt-4 flex items-center gap-3">
        <Pill variant="outline" disabled={!text.trim()} onClick={() => { setAdded(addProjects(splitUrls(text)).length); setText(""); }}>Add to queue</Pill>
        {added !== null && <span className="text-sm text-muted-foreground">{added === 0 ? "Already in the list." : `${added} added.`}</span>}
      </div>
    </section>
  );
}

function ShowcaseCard() {
  const [url, setUrl] = useState("");
  const [st, setSt] = useState<{ k: "idle" } | { k: "loading" } | { k: "error"; m: string } | { k: "list"; items: Discovered[] }>({ k: "idle" });
  const [sel, setSel] = useState<Set<string>>(new Set());
  const scan = async () => {
    setSt({ k: "loading" });
    try {
      const items = await scanShowcase(url.trim());
      setSel(new Set(items.map((i) => i.repoUrl)));
      setSt({ k: "list", items });
    } catch (e) {
      setSt({ k: "error", m: e instanceof Error ? e.message : "Scan failed." });
    }
  };
  return (
    <section className="glass p-5 sm:p-6" aria-label="Scan showcase page">
      <label htmlFor="showcase" className="eyebrow font-mono">Scan showcase page</label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input id="showcase" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://event.dev/showcase"
          className="h-10 min-w-0 sm:flex-1 rounded-full border border-border bg-well px-4 font-mono text-sm outline-hidden focus:border-primary" />
        <Pill variant="outline" disabled={!url.trim() || st.k === "loading"} onClick={() => void scan()}>{st.k === "loading" ? "Scanning…" : "Scan"}</Pill>
      </div>
      {st.k === "error" && <p className="mt-3 text-sm text-fail">{st.m} <button className="underline" onClick={() => void scan()}>Retry</button></p>}
      {st.k === "loading" && <div className="mt-4 space-y-2"><div className="h-3 w-2/3 animate-pulse rounded bg-foreground/10" /><div className="h-3 w-1/2 animate-pulse rounded bg-foreground/10" /></div>}
      {st.k === "list" && (st.items.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No projects found on that page.</p> : (
        <div className="mt-4">
          <ul className="space-y-1">
            {st.items.map((i) => (
              <li key={i.repoUrl}>
                <label className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-sm hover:bg-secondary">
                  <input type="checkbox" className="size-4 accent-(--brand)" checked={sel.has(i.repoUrl)} onChange={() => setSel((s) => { const n = new Set(s); if (n.has(i.repoUrl)) n.delete(i.repoUrl); else n.add(i.repoUrl); return n; })} />
                  <span className="min-w-0 truncate">{i.name}</span>
                </label>
              </li>
            ))}
          </ul>
          <Pill className="mt-3" disabled={sel.size === 0} onClick={() => { addProjects(st.items.filter((i) => sel.has(i.repoUrl))); setSt({ k: "idle" }); setUrl(""); }}>Add selected ({sel.size})</Pill>
        </div>
      ))}
    </section>
  );
}
