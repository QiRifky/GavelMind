import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { RubricEditor } from "@/components/rubric-editor";
import { StepBody, WorkflowNav } from "@/components/workflow-nav";
import { Button } from "@/components/ui/button";

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
  return <><WorkflowNav current="rubric" /><StepBody><RubricEditor /><footer className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5"><Button asChild variant="outline" className="rounded-full"><Link to="/app/event">Back to event</Link></Button><Button asChild className="rounded-full"><Link to="/app/entries">Continue to entries <ArrowRight /></Link></Button></footer></StepBody></>;
}
