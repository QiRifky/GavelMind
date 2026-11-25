import { createFileRoute, redirect } from "@tanstack/react-router";

// Old address kept as a permanent redirect.
export const Route = createFileRoute("/leaderboard")({
  beforeLoad: () => {
    throw redirect({ to: "/app/results", statusCode: 301 });
  },
});
