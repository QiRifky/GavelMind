import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Folder, FolderOpen, FolderPlus, Trash2, ExternalLink } from "lucide-react";
import { createFolder, deleteFolder, folderName, folderStats, switchFolder, useApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Event folder switcher: every page shows which event's workspace is open. */
export function EventFolders() {
  const state = useApi();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const active = state.folders.find((f) => f.id === state.activeFolderId);
  const stats = folderStats(state.activeFolderId, state);
  const submit = (e: React.FormEvent) => { e.preventDefault(); createFolder(name); setName(""); setAdding(false); };

  return (
    <section aria-label="Event folders" className="mb-6 overflow-hidden rounded-2xl border border-border bg-card shadow-glass">
      <div className="flex gap-2 overflow-x-auto border-b border-border bg-well/50 p-2">
        {state.folders.map((f) => {
          const on = f.id === state.activeFolderId;
          const s = folderStats(f.id, state);
          return (
            <button key={f.id} type="button" onClick={() => switchFolder(f.id)} aria-pressed={on}
              className={cn("flex min-w-0 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring", on ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary")}>
              {on ? <FolderOpen className="size-4 shrink-0 text-primary" aria-hidden="true" /> : <Folder className="size-4 shrink-0" aria-hidden="true" />}
              <span className="max-w-48 truncate font-medium">{folderName(f, state)}</span>
              <span className="font-mono text-xs tabular-nums opacity-70">{s.projects}</span>
            </button>
          );
        })}
        {adding ? (
          <form onSubmit={submit} className="flex shrink-0 items-center gap-2">
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Event name" aria-label="New event folder name"
              className="h-9 w-44 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring" />
            <Button type="submit" size="sm" className="rounded-full">Create</Button>
            <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={() => setAdding(false)}>Cancel</Button>
          </form>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
            <FolderPlus className="size-4" aria-hidden="true" />New event folder
          </button>
        )}
      </div>
      {active && (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4">
          <div className="min-w-0">
            <p className="eyebrow font-mono">Open event folder</p>
            <p className="mt-1 truncate text-lg font-medium">{folderName(active, state)}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{stats.projects} projects · {stats.ready} ready</span>
              <span>{stats.confirmed ? `${state.event?.rules.filter((r) => r.enabled).length ?? 0} rules confirmed` : "Rules not confirmed"}</span>
              <span>{stats.finalized ? "Results final" : "Draft, not final"}</span>
              {state.event?.url ? <a href={state.event.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Event guide <ExternalLink className="size-3" aria-hidden="true" /></a> : <Link to="/app/event" className="text-primary hover:underline">Add event details</Link>}
            </p>
          </div>
          {state.folders.length > 1 && (
            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-destructive" aria-label={`Delete folder ${folderName(active, state)}`} title="Delete this folder"
              onClick={() => { if (window.confirm(`Delete "${folderName(active, state)}" and all its projects and scores?`)) deleteFolder(active.id); }}>
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
