import { useEffect, useRef, useState } from "react";
import { FileUp, Globe, Upload, Check, ArrowRight } from "lucide-react";
import { addProjects, scanShowcase, snapshot, useApi, type Discovered } from "@/lib/api";
import { parseImportFile } from "@/lib/project-import";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ProjectImport() {
  const { activeFolderId, projects } = useApi();
  const [url, setUrl] = useState("");
  const [items, setItems] = useState<Discovered[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const version = useRef(0);
  useEffect(() => { version.current++; setItems([]); setPicked(new Set()); setError(""); setNotice(""); setBusy(false); }, [activeFolderId]);
  const known = new Set(projects.map((p) => p.repoUrl.toLowerCase()));
  const available = items.filter((p) => !known.has(p.repoUrl.toLowerCase()));
  const selected = available.filter((p) => picked.has(p.repoUrl));
  const preview = (found: Discovered[], message: string) => { setItems(found); setPicked(new Set(found.filter((p) => !known.has(p.repoUrl.toLowerCase())).map((p) => p.repoUrl))); setNotice(message); };
  const loadFile = async (file: File | undefined) => {
    if (!file || busy) return;
    setError(""); setNotice(""); setItems([]); setBusy(true);
    const folder = activeFolderId; const request = ++version.current;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("Choose a file smaller than 5 MB.");
      const result = parseImportFile(file.name, await file.text());
      if (snapshot().activeFolderId !== folder || request !== version.current) return;
      preview(result.items, `${file.name} · ${result.items.length} projects${result.skipped ? ` · ${result.skipped} invalid or duplicate rows skipped` : ""}`);
    } catch (e) { if (request === version.current) setError(e instanceof Error ? e.message : "Couldn't read this file."); }
    finally { if (request === version.current) setBusy(false); if (fileInput.current) fileInput.current.value = ""; }
  };
  const scan = async () => {
    const folder = activeFolderId; const request = ++version.current;
    setBusy(true); setError(""); setNotice(""); setItems([]);
    try {
      const parsed = new URL(url); if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Enter a public website URL.");
      const found = await scanShowcase(url.trim());
      if (snapshot().activeFolderId !== folder || request !== version.current) return;
      preview(found, `${found.length} repository links found`);
    } catch (e) { if (request === version.current) setError(e instanceof Error ? e.message : "Couldn't scan this showcase."); }
    finally { if (request === version.current) setBusy(false); }
  };
  const add = () => {
    const added = addProjects(selected);
    setNotice(`${added.length} projects added to the queue.`); setPicked(new Set());
  };
  return <section aria-label="Import projects" className="py-2">
    <Tabs defaultValue="file">
      <TabsList className="grid w-full grid-cols-2 bg-well">
        <TabsTrigger value="file" className="gap-2"><FileUp className="size-4" />Upload file</TabsTrigger>
        <TabsTrigger value="web" className="gap-2"><Globe className="size-4" />Showcase URL</TabsTrigger>
      </TabsList>
      <TabsContent value="file" forceMount className="mt-4 data-[state=inactive]:hidden">
        <div onDragOver={(e) => { e.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); void loadFile(e.dataTransfer.files[0]); }} className={`flex min-h-40 flex-col items-center justify-center gap-3 rounded-card border border-dashed p-5 text-center ${dragging ? "border-primary bg-accent" : "border-border bg-well/30"}`}>
          <Upload className="size-6 text-primary" aria-hidden="true" />
          <p className="text-sm font-medium">Drop a project file</p>
          <p className="text-xs text-muted-foreground">CSV, JSON or TXT · up to 5 MB</p>
          <Button variant="outline" disabled={busy} onClick={() => fileInput.current?.click()}><FileUp className="size-4" />Choose file</Button>
          <input ref={fileInput} type="file" accept=".csv,.json,.txt" aria-label="Upload project file" className="hidden" disabled={busy} onChange={(e) => void loadFile(e.target.files?.[0])} />
        </div>
      </TabsContent>
      <TabsContent value="web" forceMount className="mt-4 data-[state=inactive]:hidden">
        <form onSubmit={(e) => { e.preventDefault(); void scan(); }}>
          <label htmlFor="showcase" className="eyebrow font-mono">Showcase URL</label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input id="showcase" type="url" required maxLength={500} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://event.dev/showcase" className="h-10 min-w-0 flex-1 rounded-full border border-border bg-well px-4 text-sm outline-hidden focus:border-primary" />
            <Button type="submit" disabled={busy || !url.trim()}><Globe className="size-4" />Scan</Button>
          </div>
        </form>
      </TabsContent>
    </Tabs>
    {busy && <p role="status" className="mt-4 text-sm text-muted-foreground">Reading projects…</p>}
    {error && <p role="alert" className="mt-4 break-words text-sm text-fail">{error}</p>}
    {notice && <p role="status" className="mt-4 break-words text-xs text-muted-foreground">{notice}</p>}
    {items.length > 0 && <div className="mt-4">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <h3 className="text-sm font-medium">Import preview</h3>
        <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" aria-label="Select all imported projects" disabled={!available.length} checked={available.length > 0 && selected.length === available.length} onChange={() => setPicked(selected.length === available.length ? new Set() : new Set(available.map((p) => p.repoUrl)))} className="accent-(--brand)" />Select all</label>
      </div>
      <ul className="max-h-64 divide-y divide-border overflow-y-auto">
        {items.map((p) => <li key={p.repoUrl} className="py-3"><label className="flex items-start gap-3"><input type="checkbox" aria-label={`Import ${p.name}`} checked={!known.has(p.repoUrl.toLowerCase()) && picked.has(p.repoUrl)} disabled={known.has(p.repoUrl.toLowerCase())} onChange={() => setPicked((old) => { const next = new Set(old); if (next.has(p.repoUrl)) next.delete(p.repoUrl); else next.add(p.repoUrl); return next; })} className="mt-1 shrink-0 accent-(--brand)" /><span className="min-w-0 flex-1"><span className="block break-words text-sm font-medium">{p.name}</span><span className="mt-1 block break-all text-xs text-muted-foreground">{p.repoUrl}</span>{p.demoUrl && <span className="mt-1 block break-all text-xs text-muted-foreground">{p.demoUrl}</span>}{known.has(p.repoUrl.toLowerCase()) && <span className="mt-1 flex items-center gap-1 text-xs text-pass"><Check className="size-3" />Already in queue</span>}</span></label></li>)}
      </ul>
      <Button className="mt-4 w-full gap-2" disabled={!selected.length || busy} onClick={add}>Add selected ({selected.length})<ArrowRight className="size-4" /></Button>
    </div>}
  </section>;
}