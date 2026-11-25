import { createFileRoute, redirect } from "@tanstack/react-router";

// Old address kept as a permanent redirect.
export const Route = createFileRoute("/report/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/app/p/$id", params: { id: params.id }, statusCode: 301 });
  },
});
