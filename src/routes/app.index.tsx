import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FolderPlus } from "lucide-react";
import { Folder3D } from "@/components/ui/folder";
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
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {state.folders.map((f) => {
          const s = folderStats(f.id, state);
          return (
            <button key={f.id} type="button" onClick={() => open(f.id)}
              className="group flex flex-col items-start rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
              <span className="transition-transform duration-300 ease-out group-hover:-translate-y-1 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
                <Folder3D><span className="text-xs font-medium">{s.projects} projects</span></Folder3D>
              </span>
              <span className="mt-5"><Badge tone={s.finalized ? "good" : "neutral"}>{s.finalized ? "Results final" : "Draft, not final"}</Badge></span>
              <span className="mt-3 block max-w-full truncate text-lg font-medium">{folderName(f, state)}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{s.projects} projects · {s.ready} ready · {s.confirmed ? "Rules confirmed" : "Rules not confirmed"}</span>
            </button>
          );
        })}
        <EventDetailsDialog trigger={
          <button type="button" className="group flex h-full flex-col items-start rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
            <span className="flex h-40 w-60 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border text-muted-foreground transition-colors group-hover:border-primary group-hover:text-primary motion-reduce:transition-none">
              <FolderPlus className="size-16" aria-hidden="true" />
              <span className="text-sm font-medium text-primary">New event folder</span>
            </span>
          </button>
        } />
      </div>
    </div>
  );
}
