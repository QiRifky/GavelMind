import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Folder, FolderOpen } from "lucide-react";
import { folderName, folderStats, switchFolder, useApi } from "@/lib/api";
import { EventDetailsDialog } from "@/components/event-details-dialog";
import { Badge, PageHead } from "@/components/ui-bits";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Event folders — Gavel Mind" }, { name: "description", content: "Pick an event folder to open its rules, entries, rubric and results." }] }),
  component: Folders,
});

function Folders() {
  const state = useApi();
  const navigate = useNavigate();
  const open = (id: string) => { switchFolder(id); void navigate({ to: "/app/event" }); };
  return (
    <div>
      <PageHead eyebrow="Event folders" title="Choose an event.">Each folder keeps its own rules, entries, rubric and results.</PageHead>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {state.folders.map((f) => {
          const s = folderStats(f.id, state);
          const on = f.id === state.activeFolderId;
          return (
            <button key={f.id} type="button" onClick={() => open(f.id)}
              className="group flex min-h-44 flex-col rounded-lg border border-border bg-card p-5 text-left shadow-glass transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-ring">
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">{on ? <FolderOpen className="size-5" aria-hidden="true" /> : <Folder className="size-5" aria-hidden="true" />}</div>
                <Badge tone={s.finalized ? "good" : "neutral"}>{s.finalized ? "Results final" : "Draft, not final"}</Badge>
              </div>
              <p className="mt-4 truncate text-lg font-medium">{folderName(f, state)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.projects} projects · {s.ready} ready · {s.confirmed ? "Rules confirmed" : "Rules not confirmed"}</p>
              <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm text-primary">Open folder <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
            </button>
          );
        })}
        <div className="flex min-h-44 items-center justify-center rounded-lg border border-dashed border-border bg-well/40 p-5"><EventDetailsDialog /></div>
      </div>
    </div>
  );
}
