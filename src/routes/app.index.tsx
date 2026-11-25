import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { addProjects, analyzeProject, judgeStatusOf, removeProject, scanShowcase, useApi, type Discovered, type EntryStatus, type JudgeStatus } from "@/lib/api";
import { AnalyzeCard } from "@/components/analyze-card";
import { Badge, PageHead, Pill } from "@/components/ui-bits";
import { cn } from "@/lib/utils";

const STATUSES = ["all", "queued", "analyzing", "done", "failed"] as const;

export const Route = createFileRoute("/app/")({
  validateSearch: (search: Record<string, unknown>): { q?: string; status?: string } => ({
    ...(typeof search["q"] === "string" && search["q"] ? { q: search["q"] } : {}),
    ...(typeof search["status"] === "string" && search["status"] !== "all" ? { status: search["status"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Entries — GavelMind" },
      { name: "description", content: "Add hackathon projects and let GavelMind prepare material for your review." },
      { property: "og:title", content: "Entries — GavelMind" },
      { property: "og:description", content: "Add hackathon projects and let GavelMind prepare material for your review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Entries,
});

const statusTone: Record<EntryStatus, "neutral" | "accent" | "good" | "bad"> = { queued: "neutral", analyzing: "accent", done: "good", failed: "bad" };
const judgeTone: Record<JudgeStatus, "neutral" | "accent" | "good"> = { "Not reviewed": "neutral", "In review": "accent", Finalized: "good" };

function Entries() {
  const s = useApi();
  const { q = "", status = "all" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const needle = q.toLowerCase();
  const shown = s.projects.filter((p) => (status === "all" || p.status === status) && (p.name.toLowerCase().includes(needle) || p.repoUrl.toLowerCase().includes(needle)));
  const toggle = (id: string) => setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const runSelected = async () => {
    const ids = [...selected].filter((id) => s.projects.find((p) => p.id === id)?.status !== "analyzing");
    setSelected(new Set());
    for (const id of ids) await analyzeProject(id, { stageMs: 450 }).catch(() => undefined);
  };
  const allShown = shown.length > 0 && shown.every((p) => selected.has(p.id));

  return (
    <>
      <PageHead eyebrow="Step 1 · Entries" title={<>Add the projects. <span className="text-primary">You'll judge them.</span></>}>
        GavelMind runs and reads each project, then prepares material and draft scores. You make every final decision.
      </PageHead>
      <div className="mb-6"><AnalyzeCard /></div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <AddProjects />
        <section aria-label="Projects" className="glass flex flex-col p-3 sm:p-4">
          <div className="flex flex-col gap-2 p-2 sm:flex-row">
            <input aria-label="Search projects" value={q} onChange={(e) => void navigate({ search: (prev) => ({ ...prev, q: e.target.value }), replace: true })} placeholder="Search projects" className="h-10 min-w-0 flex-1 rounded-full border border-border bg-well px-4 text-sm outline-hidden focus:border-primary" />
            <select aria-label="Filter by status" value={status} onChange={(e) => void navigate({ search: (prev) => ({ ...prev, status: e.target.value }), replace: true })} className="h-10 rounded-full border border-border bg-secondary px-3 text-sm">
              {STATUSES.map((x) => <option key={x} value={x}>{x === "all" ? "All statuses" : x}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-3 pb-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" className="accent-(--brand)" checked={allShown} onChange={() => setSelected(allShown ? new Set() : new Set(shown.map((p) => p.id)))} />
              Select all
            </label>
            <Pill disabled={selected.size === 0} onClick={() => void runSelected()}>Analyze selected{selected.size ? ` (${selected.size})` : ""}</Pill>
          </div>
          {s.projects.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-medium">No projects yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">Paste repo URLs on the left, or scan a showcase page to get started.</p>
            </div>
          ) : shown.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No projects match this search or filter.</p>
          ) : (
            <ul className="divide-y divide-border/70">
              {shown.map((p) => {
                const js = judgeStatusOf(s, p.id);
                return (
                  <li key={p.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 px-3 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                    <input type="checkbox" aria-label={`Select ${p.name}`} className="mt-1 accent-(--brand) sm:mt-0" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.repoUrl}</p>
                      {p.demoUrl && <p className="truncate text-xs text-muted-foreground">Demo: {p.demoUrl}</p>}
                      {p.error && <p className="text-xs text-fail">{p.error}</p>}
                    </div>
                    <div className="col-start-2 flex flex-wrap items-center gap-2 sm:col-start-auto">
                      <Badge tone={statusTone[p.status]}>{p.status === "analyzing" ? "analyzing…" : p.status}</Badge>
                      <Badge tone={judgeTone[js]}>{js}</Badge>
                      {p.status === "done" ? (
                        <Link to="/app/p/$id" params={{ id: p.id }} className="rounded-full px-3 py-1 text-sm text-primary hover:bg-accent">Report</Link>
                      ) : (
                        <button onClick={() => removeProject(p.id)} className="rounded-full px-2 py-1 text-sm text-muted-foreground hover:text-destructive" aria-label={`Remove ${p.name}`}>×</button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function AddProjects() {
  const [tab, setTab] = useState<"paste" | "scan">("paste");
  const [text, setText] = useState("");
  const [page, setPage] = useState("");
  const [scan, setScan] = useState<{ kind: "idle" } | { kind: "loading" } | { kind: "error"; msg: string } | { kind: "ok"; items: Discovered[]; picked: Set<string> }>({ kind: "idle" });
  const doScan = async () => {
    setScan({ kind: "loading" });
    try {
      const items = await scanShowcase(page.trim());
      setScan({ kind: "ok", items, picked: new Set(items.map((i) => i.repoUrl)) });
    } catch (e) {
      setScan({ kind: "error", msg: e instanceof Error ? e.message : "Scan failed." });
    }
  };
  return (
    <section aria-label="Add projects" className="glass flex flex-col p-5 sm:p-6">
      <div role="tablist" className="mb-4 inline-flex self-start rounded-full bg-well p-1">
        {(["paste", "scan"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("rounded-full px-4 py-1.5 text-sm", tab === t ? "bg-secondary text-foreground" : "text-muted-foreground")}>{t === "paste" ? "Paste URLs" : "Scan showcase page"}</button>
        ))}
      </div>
      {tab === "paste" ? (
        <>
          <label htmlFor="urls" className="eyebrow font-mono">Repo or project URLs, one per line</label>
          <textarea id="urls" value={text} onChange={(e) => setText(e.target.value)} rows={7} placeholder={"https://github.com/team/project-one\nhttps://github.com/team/project-two"} className="mt-3 min-h-44 w-full flex-1 resize-y rounded-2xl border border-border bg-well p-4 font-mono text-sm leading-relaxed text-muted-foreground outline-hidden transition placeholder:text-muted-foreground/60 focus:border-primary" />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Pill variant="outline" size="lg" disabled={!text.trim()} onClick={() => { addProjects(text); setText(""); }}>Add to queue</Pill>
            <Pill size="lg" disabled={!text.trim()} onClick={() => { const ids = addProjects(text); setText(""); void (async () => { for (const id of ids) await analyzeProject(id, { stageMs: 450 }).catch(() => undefined); })(); }}>Add and analyze →</Pill>
          </div>
        </>
      ) : (
        <>
          <label htmlFor="page" className="eyebrow font-mono">Showcase page URL</label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input id="page" value={page} onChange={(e) => setPage(e.target.value)} placeholder="https://hackathon.example/showcase" className="h-11 min-w-0 flex-1 rounded-full border border-border bg-well px-5 font-mono text-sm outline-hidden focus:border-primary" />
            <Pill size="lg" disabled={!page.trim() || scan.kind === "loading"} onClick={() => void doScan()}>{scan.kind === "loading" ? "Scanning…" : "Scan"}</Pill>
          </div>
          {scan.kind === "error" && <p role="alert" className="mt-3 text-sm text-fail">{scan.msg}</p>}
          {scan.kind === "ok" && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Found {scan.items.length} projects</p>
              <ul className="mt-2 space-y-1">
                {scan.items.map((i) => (
                  <li key={i.repoUrl}>
                    <label className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-secondary">
                      <input type="checkbox" className="accent-(--brand)" checked={scan.picked.has(i.repoUrl)} onChange={() => { const n = new Set(scan.picked); if (n.has(i.repoUrl)) n.delete(i.repoUrl); else n.add(i.repoUrl); setScan({ ...scan, picked: n }); }} />
                      <span className="min-w-0 truncate text-sm">{i.name}</span>
                      {i.demoUrl && <span className="ml-auto shrink-0 text-xs text-muted-foreground">has demo</span>}
                    </label>
                  </li>
                ))}
              </ul>
              <Pill className="mt-3" disabled={scan.picked.size === 0} onClick={() => {
                const picked = scan.items.filter((i) => scan.picked.has(i.repoUrl));
                addProjects(picked.map((i) => i.repoUrl).join("\n"), Object.fromEntries(picked.flatMap((i) => (i.demoUrl ? [[i.repoUrl, i.demoUrl]] : []))));
                setScan({ kind: "idle" }); setPage("");
              }}>Add selected ({scan.picked.size})</Pill>
            </div>
          )}
        </>
      )}
    </section>
  );
}
