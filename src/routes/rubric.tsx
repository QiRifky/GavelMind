import { createFileRoute, redirect } from "@tanstack/react-router";

// Old address kept as a permanent redirect.
export const Route = createFileRoute("/rubric")({
  beforeLoad: () => {
    throw redirect({ to: "/app/event", hash: "rubric", statusCode: 301 });
  },
});
