import { createFileRoute } from "@tanstack/react-router";
import { useApi } from "@/lib/api";
import { PageHead } from "@/components/ui-bits";

export const Route = createFileRoute("/changelog")({
  head: () => ({
    meta: [
      { title: "Change log — GavelMind" },
      { name: "description", content: "Every edit the judge made, with old and new values." },
      { property: "og:title", content: "Change log — GavelMind" },
      { property: "og:description", content: "Every edit the judge made, with old and new values." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChangeLog,
});

function ChangeLog() {
  const { log } = useApi();
  return (
    <>
      <PageHead eyebrow="Audit trail" title="Change log">Every judge edit, newest first.</PageHead>
      <section className="glass p-2 sm:p-3">
        <ul className="divide-y divide-border/70">
          {log.map((l) => (
            <li key={l.id} className="grid gap-1 px-3 py-3 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
              <time className="text-xs tabular-nums text-muted-foreground">{new Date(l.at).toLocaleTimeString()}</time>
              <span className="min-w-0 truncate text-sm">{l.what}</span>
              <span className="text-sm tabular-nums"><span className="text-muted-foreground line-through">{l.oldValue}</span> → <span className="font-medium text-primary">{l.newValue}</span></span>
            </li>
          ))}
          {log.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No edits yet.</li>}
        </ul>
      </section>
    </>
  );
}
