import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FolderPlus } from "lucide-react";
import { Folder3D } from "@/components/ui/folder";
import { folderName, folderStats, switchFolder, useApi } from "@/lib/api";
import { EventDetailsDialog } from "@/components/event-details-dialog";
import { Badge, PageHead } from "@/components/ui-bits";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Event folders — Gavel Mind" }, { name: "description", content: "Pick an event folder to open its rules, entries, rubric and results." }, { property: "og:title", content: "Event folders — Gavel Mind" }, { property: "og:description", content: "Pick an event folder to open its rules, entries, rubric and results." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Folders,
});

function Folders() {
  const state = useApi();
  const navigate = useNavigate();
  const open = (id: string) => { switchFolder(id); void navigate({ to: "/app/event" }); };
  return (
    <div className="workspace-stage flex-1 p-5 sm:p-7">
      <PageHead eyebrow="Event folders" title="Choose an event.">Each folder keeps its own rules, entries, rubric and results.</PageHead>
      <div className="grid grid-cols-[repeat(auto-fill,15rem)] gap-x-6 gap-y-8">
        <EventDetailsDialog trigger={
          <button type="button" className="group flex h-full flex-col items-start rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
            <span className="glass-panel flex h-40 w-60 flex-col items-center justify-center gap-4 border-dashed text-muted-foreground transition-colors group-hover:border-primary group-hover:text-primary motion-reduce:transition-none">
              <FolderPlus className="size-16" aria-hidden="true" />
              <span className="text-sm font-medium text-primary">New event folder</span>
            </span>
          </button>
        } />
        {state.folders.map((f) => {
          const s = folderStats(f.id, state);
          return (
            <button key={f.id} type="button" onClick={() => open(f.id)}
              className="group flex flex-col items-start rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
              <span className="transition-transform duration-300 ease-out group-hover:-translate-y-1 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
                <Folder3D>
                  <Badge tone={s.finalized ? "good" : "neutral"}>{s.finalized ? "Results final" : "Draft, not final"}</Badge>
                  <span className="block max-w-full truncate text-base font-semibold">{folderName(f, state)}</span>
                  <span className="block max-w-full text-[11px] leading-snug text-primary-foreground/80">{s.projects} projects · {s.ready} ready · {s.confirmed ? "Rules confirmed" : "Rules not confirmed"}</span>
                </Folder3D>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
