import { createFileRoute, redirect } from "@tanstack/react-router";

// Rubric now lives on the Event & Rubric setup page; keep old links working.
export const Route = createFileRoute("/app/rubric")({
  beforeLoad: () => {
    throw redirect({ to: "/app/event", hash: "rubric", statusCode: 301 });
  },
});
