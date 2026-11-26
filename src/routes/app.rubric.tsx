import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { RubricEditor } from "@/components/rubric-editor";
import { WorkflowNav } from "@/components/workflow-nav";
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/api";

export const Route = createFileRoute("/app/rubric")({
  head: () => ({ meta: [
    { title: "Rubric — Gavel Mind" },
    { name: "description", content: "Set scoring criteria and weights for judging." },
    { property: "og:title", content: "Rubric — Gavel Mind" },
    { property: "og:description", content: "Set scoring criteria and weights for judging." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: RubricPage,
});

function RubricPage() {
  const state = useApi();
  const ready = state.projects.find((p) => p.status === "done");
  return <div><WorkflowNav current="rubric" /><RubricEditor /><footer className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5"><Button asChild variant="outline" className="rounded-full"><Link to="/app/entries">Back to entries</Link></Button>{ready ? <Button asChild className="rounded-full"><Link to="/app/p/$id" params={{ id: ready.id }}>Start judging <ArrowRight /></Link></Button> : <Button asChild className="rounded-full"><Link to="/app/entries">Add submissions <ArrowRight /></Link></Button>}</footer></div>;
}
