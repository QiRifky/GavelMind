import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, FolderGit2, Github, Link2, Trash2, Layers, Globe } from "lucide-react";
import { addProjects, analyzeProject, judgeStatus, removeProject, scanShowcase, splitUrls, useApi, type Discovered } from "@/lib/api";
import { AnalyzeCard } from "@/components/analyze-card";
import { Badge, Pill } from "@/components/ui-bits";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsBento } from "@/components/ui/stats-bento";
import { StepBody, WorkflowNav } from "@/components/workflow-nav";

export const Route = createFileRoute("/app/entries")({
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Entries,
});

function Entries() {
  const state = useApi();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const rows = state.projects;
  const ready = rows.filter((p) => p.status === "done");
  const nextReview = ready.find((p) => judgeStatus(p.id, state) === "Not reviewed") ?? ready[0];
  const toggle = (id: string) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const selectable = rows.filter((p) => p.status !== "analyzing");
  const allPicked = selectable.length > 0 && selectable.every((p) => picked.has(p.id));
  const somePicked = selectable.some((p) => picked.has(p.id));
  const allRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (allRef.current) allRef.current.indeterminate = somePicked && !allPicked; }, [somePicked, allPicked]);
  const selectAll = () => setPicked(allPicked ? new Set() : new Set(selectable.map((p) => p.id)));
  const analyzeSelected = () => {
    for (const id of picked) void analyzeProject(id, { stageMs: 600 }).catch(() => undefined);
    setPicked(new Set());
  };

  return (
    <>
      <WorkflowNav current="entries" />
      <StepBody className="grid items-start gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-stretch">
      <div className="lg:col-span-2"><StatsBento hero={{ badge: "Projects", value: rows.length, caption: "Submissions in this event" }} trend={{ label: "Analysis ready", value: `${rows.length ? Math.round((ready.length / rows.length) * 100) : 0}%`, bars: (["queued", "analyzing", "done", "failed"] as const).map((k) => rows.filter((p) => p.status === k).length) }} tiles={[{ label: "Ready", value: ready.length }, { label: "Queued", value: rows.filter((p) => p.status === "queued").length }]} /></div>
      <section className="overflow-hidden bento " aria-label="Add submissions">
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 sm:px-6"><h2 className="text-lg font-medium">Add submissions</h2><Badge tone="neutral">Mock analysis</Badge></header>
        <Tabs defaultValue="single" className="p-5 sm:p-6">
          <TabsList aria-label="Submission input method" className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl bg-well p-1.5">
            <TabsTrigger value="single" className="min-w-0 flex-col gap-1 whitespace-normal px-1 py-3 text-xs data-[state=active]:bg-accent data-[state=active]:text-accent-foreground sm:flex-row sm:gap-2 sm:text-sm"><Github className="size-4 shrink-0" />Single Analyze</TabsTrigger>
            <TabsTrigger value="bulk" className="min-w-0 flex-col gap-1 whitespace-normal px-1 py-3 text-xs data-[state=active]:bg-accent data-[state=active]:text-accent-foreground sm:flex-row sm:gap-2 sm:text-sm"><Layers className="size-4 shrink-0" />Bulk Repos</TabsTrigger>
            <TabsTrigger value="showcase" className="min-w-0 flex-col gap-1 whitespace-normal px-1 py-3 text-xs data-[state=active]:bg-accent data-[state=active]:text-accent-foreground sm:flex-row sm:gap-2 sm:text-sm"><Globe className="size-4 shrink-0" />Import Showcase</TabsTrigger>
          </TabsList>
          <TabsContent value="single" forceMount className="mt-4 data-[state=inactive]:hidden"><AnalyzeCard embedded /></TabsContent>
          <TabsContent value="bulk" forceMount className="mt-4 data-[state=inactive]:hidden"><PasteCard /></TabsContent>
          <TabsContent value="showcase" forceMount className="mt-4 data-[state=inactive]:hidden"><ShowcaseCard /></TabsContent>
        </Tabs>
        <p className="border-t border-border px-5 py-3 text-xs leading-relaxed text-muted-foreground sm:px-6">Demo mode · Repository and showcase content are not fetched. AI drafts use sample material; changes reset on reload.</p>
      </section>

      <section className="flex flex-col overflow-hidden bento lg:min-h-0" aria-label="Projects">
        <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <FolderGit2 className="size-5 text-primary" aria-hidden="true" />
            <h2 className="text-base font-medium">Project queue</h2>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input ref={allRef} type="checkbox" checked={allPicked} onChange={selectAll} disabled={selectable.length === 0} aria-label="Select all projects" className="size-4 cursor-pointer accent-(--brand) focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring" />
              <span>Select all</span>
            </label>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">{rows.length} projects</span>
          </div>
        </header>
        {state.projects.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium">No projects yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Paste repo URLs above or scan a showcase page to start.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border lg:max-h-[28rem] lg:overflow-y-auto">
            {rows.map((p) => (
              <li key={p.id} className={`grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 px-5 py-5 transition-colors sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:px-6 ${picked.has(p.id) ? "bg-accent" : "hover:bg-secondary/40"}`}>
                <input type="checkbox" checked={picked.has(p.id)} onChange={() => toggle(p.id)} disabled={p.status === "analyzing"} aria-label={`Select ${p.name}`} className="size-4 cursor-pointer accent-(--brand) focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring" />
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium sm:text-base">{p.name}</p>
                  <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"><Github className="size-3 shrink-0" aria-hidden="true" /><span className="truncate">{p.repoUrl}</span></p>
                  {p.demoUrl && <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"><Link2 className="size-3 shrink-0" aria-hidden="true" /><span className="truncate">{p.demoUrl}</span></p>}
                </div>
                <div className="col-start-2 flex flex-wrap items-center justify-end gap-2 sm:col-start-auto">
                  {p.status !== "done" && <Pill variant="outline" onClick={() => removeProject(p.id)} className="h-9 w-9 shrink-0 px-0 text-muted-foreground hover:text-destructive" aria-label={`Remove ${p.name}`} title={`Remove ${p.name}`}><Trash2 className="size-3.5" aria-hidden="true" /></Pill>}
                </div>
              </li>
            ))}
          </ul>
        )}
        <footer className="mt-auto flex shrink-0 flex-wrap items-center justify-between gap-4 border-t border-border bg-well/50 px-5 py-4 sm:px-6">
          <span className="text-sm tabular-nums text-muted-foreground"><span className="font-medium text-foreground">{picked.size}</span> selected</span>
          <Pill size="lg" disabled={picked.size === 0} onClick={analyzeSelected}>Analyze selected <ArrowRight className="size-4" aria-hidden="true" /></Pill>
        </footer>
      </section>
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4 lg:col-span-2">
        <Button asChild variant="outline" className="rounded-full"><Link to="/app/rubric">Back to rubric</Link></Button>
        {nextReview && <Button asChild className="rounded-full"><Link to="/app/p/$id" params={{ id: nextReview.id }}>Start judging · {ready.length} ready <ArrowRight /></Link></Button>}
      </footer>
      </StepBody>
    </>
  );
}

function PasteCard() {
  const [text, setText] = useState("");
  const [added, setAdded] = useState<number | null>(null);
  return (
    <section className="flex flex-col py-4" aria-label="Paste URLs">
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
    <section className="py-4" aria-label="Import showcase">
      <label htmlFor="showcase" className="eyebrow font-mono">Showcase URL</label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input id="showcase" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://event.dev/showcase"
          className="h-10 min-w-0 sm:flex-1 rounded-full border border-border bg-well px-4 font-mono text-sm outline-hidden focus:border-primary" />
        <ShinyButton className="h-10" label={st.k === "loading" ? "Scanning…" : "Scan"} disabled={!url.trim() || st.k === "loading"} onClick={() => void scan()} />
      </div>
      {st.k === "error" && <p className="mt-3 text-sm text-fail">{st.m} <Button variant="link" className="px-2" onClick={() => void scan()}>Retry</Button></p>}
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
