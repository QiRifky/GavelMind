import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContextDeck } from "@/routes/app.p.$id";
import { fixtureReport } from "./analysis-fixture";

vi.mock("@/components/ui/handoff-beam", () => ({ HandoffBeam: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
afterEach(cleanup);

describe("Context table navigation", () => {
  it("moves between all three tables and preserves the summary selection", () => {
    const report = fixtureReport({ project: { id: "context", repoUrl: "https://github.com/test/project" }, criteria: [] });
    render(<ContextDeck r={report} />);
    const previous = screen.getByRole("button", { name: "Previous context table" });
    const next = screen.getByRole("button", { name: "Next context table" });
    expect(previous).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Summary style"), { target: { value: "detailed" } });
    fireEvent.click(next);
    expect(screen.getByRole("tab", { name: "Rules check" })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(next);
    expect(screen.getByRole("tab", { name: "Evidence" })).toHaveAttribute("aria-selected", "true");
    expect(next).toBeDisabled();
    fireEvent.click(previous);
    fireEvent.click(previous);
    expect(screen.getByLabelText("Summary style")).toHaveValue("detailed");
  });
});