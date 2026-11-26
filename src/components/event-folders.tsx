import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Trash2, ExternalLink } from "lucide-react";
import { deleteFolder, folderName, folderStats, useApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

/** Event folder switcher: every page shows which event's workspace is open. */
export function EventFolders({ children }: { children?: ReactNode }) {
  const state = useApi();
  const active = state.folders.find((f) => f.id === state.activeFolderId);
  const stats = folderStats(state.activeFolderId, state);

  return (
    <section aria-label="Event folders" className="mb-4 shrink-0 overflow-hidden rounded-lg border border-border bg-card shadow-glass">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
            <Link to="/app" aria-label="All event folders" title="All event folders" className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"><ArrowLeft className="size-4" aria-hidden="true" /><span className="hidden sm:inline">All folders</span></Link>
            {active && <p className="min-w-0 truncate text-base font-medium">{folderName(active, state)}</p>}
            {active && <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{stats.projects} projects · {stats.ready} ready</span>
              <span>{stats.confirmed ? `${state.event?.rules.filter((r) => r.enabled).length ?? 0} rules confirmed` : "Rules not confirmed"}</span>
              <span>{stats.finalized ? "Results final" : "Draft, not final"}</span>
              {state.event?.url ? <a href={state.event.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Event guide <ExternalLink className="size-3" aria-hidden="true" /></a> : <Link to="/app/event" className="text-primary hover:underline">Add event details</Link>}
            </p>}
          </div>
          {active && state.folders.length > 1 && (
            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-destructive" aria-label={`Delete folder ${folderName(active, state)}`} title="Delete this folder"
              onClick={() => { if (window.confirm(`Delete "${folderName(active, state)}" and all its projects and scores?`)) deleteFolder(active.id); }}>
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          )}
      </div>
      {active && children}
    </section>
  );
}
