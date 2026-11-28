import { createFileRoute, redirect } from "@tanstack/react-router";

// Preserve old bookmarks without retaining a rubric page.
export const Route = createFileRoute("/app/rubric")({
  beforeLoad: () => {
    throw redirect({ to: "/app/entries", statusCode: 301 });
  },
});
