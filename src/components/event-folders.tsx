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
    <section aria-label="Event folders" className="mb-5 rounded-lg border border-border bg-card shadow-glass">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
          <Link to="/app" className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" aria-hidden="true" />All folders</Link>
          {active && <><span className="text-muted-foreground" aria-hidden="true">/</span>
          <span className="truncate font-medium" title={`${stats.projects} projects · ${stats.ready} ready`}>{folderName(active, state)}</span>
          {state.event?.url && <a href={state.event.url} target="_blank" rel="noreferrer" aria-label="Open event guide" className="shrink-0 text-primary"><ExternalLink className="size-3.5" aria-hidden="true" /></a>}
          {state.folders.length > 1 && (
            <Button variant="ghost" size="icon" className="size-7 shrink-0 rounded-full text-muted-foreground hover:text-destructive" aria-label={`Delete folder ${folderName(active, state)}`} title="Delete this folder"
              onClick={() => { if (window.confirm(`Delete "${folderName(active, state)}" and all its projects and scores?`)) deleteFolder(active.id); }}>
              <Trash2 className="size-3.5" aria-hidden="true" />
            </Button>
          )}</>}
        </div>
        {active && children}
      </div>
    </section>
  );
}
