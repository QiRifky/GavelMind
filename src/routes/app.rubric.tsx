import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PageHead } from "@/components/ui-bits";
import { RubricEditor } from "@/components/rubric-editor";

export const Route = createFileRoute("/app/rubric")({
  head: () => ({ meta: [
    { title: "Rubric — Gavel Mind" },
    { name: "description", content: "Set scoring criteria and weights for judging." },
    { property: "og:title", content: "Rubric — Gavel Mind" },
    { property: "og:description", content: "Set scoring criteria and weights for judging." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <div><PageHead eyebrow="Rubric" title="Decide what counts.">Set the criteria and weights you will score every project on.</PageHead><div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground"><Link to="/app/event">01 Event</Link><ArrowRight className="size-4" /><Link to="/app">02 Entries</Link><ArrowRight className="size-4" /><span className="text-primary">03 Rubric</span><ArrowRight className="size-4" /><Link to="/app/results">04 Results</Link></div><RubricEditor /></div>,
});
