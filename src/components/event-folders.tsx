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
    <section aria-label="Event folders" className="mb-6 overflow-hidden rounded-lg border border-border bg-card shadow-glass">
      <div className="flex items-center gap-2 border-b border-border bg-well/50 px-3 py-2">
        <Link to="/app" className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" aria-hidden="true" />All event folders</Link>
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
      {active && children}
    </section>
  );
}
