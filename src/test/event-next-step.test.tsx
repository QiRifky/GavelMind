import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (_path: string) => (options: unknown) => ({ options }),
  Link: ({ children, to, ...props }: { children: ReactNode; to: string } & Record<string, unknown>) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

vi.mock("@/components/workflow-nav", () => ({
  WorkflowNav: () => null,
  StepBody: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/event-details-dialog", () => ({
  EventDetailsDialog: () => null,
}));

import { EventPage } from "@/routes/app.event";
import { confirmEventRules, saveEvent, updateEventRules } from "@/lib/api";

afterEach(cleanup);

describe("Event step next-step button", () => {
  it("goes directly to entries before any event exists", () => {
    render(<EventPage />);
    const link = screen.getByRole("link", { name: /entries/i });
    expect(link.getAttribute("href")).toBe("/app/entries");
  });

  it("goes directly to entries while rules are still unconfirmed", () => {
    saveEvent("Test event", "https://example.com/rules");
    render(<EventPage />);
    const link = screen.getByRole("link", { name: /entries/i });
    expect(link.getAttribute("href")).toBe("/app/entries");
  });

  it("goes directly to entries once rules are confirmed", () => {
    saveEvent("Test event", "https://example.com/rules");
    updateEventRules([{ id: "event-demo", label: "Provide a demo", enabled: true }]);
    expect(confirmEventRules()).toBe(true);
    render(<EventPage />);
    const link = screen.getByRole("link", { name: /entries/i });
    expect(link.getAttribute("href")).toBe("/app/entries");
  });
});
