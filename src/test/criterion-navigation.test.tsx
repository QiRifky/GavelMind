import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { CriterionDeck } from "@/components/criterion-deck";
import { snapshot } from "@/lib/api";

vi.mock("@/components/ui/handoff-beam", () => ({
  HandoffBeam: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

afterEach(cleanup);

it("moves between adjacent criteria without changing the judge's scores", () => {
  const state = snapshot();
  const report = state.reports["p1"];
  const first = state.criteria[0];
  const second = state.criteria[1];
  const last = state.criteria[state.criteria.length - 1];
  if (!report || !first || !second || !last) throw new Error("Sample report and criteria required");
  const scoresBefore = structuredClone(state.judge);
  render(<CriterionDeck report={report} criteria={state.criteria} />);
  const activeCard = (index: number, name: string) => within(screen.getByRole("group", { name: `Criterion ${index + 1} of ${state.criteria.length}: ${name}` }));
  expect(activeCard(0, first.name).getByRole("button", { name: "Back" })).toBeDisabled();
  fireEvent.click(activeCard(0, first.name).getByRole("button", { name: "Continue" }));
  fireEvent.click(activeCard(1, second.name).getByRole("button", { name: "Back" }));
  expect(activeCard(0, first.name).getByRole("spinbutton")).toBeVisible();
  for (let index = 0; index < state.criteria.length - 1; index++) {
    const criterion = state.criteria[index];
    if (!criterion) throw new Error("Criterion required");
    fireEvent.click(activeCard(index, criterion.name).getByRole("button", { name: "Continue" }));
  }
  expect(activeCard(state.criteria.length - 1, last.name).getByRole("button", { name: "Continue" })).toBeDisabled();
  expect(snapshot().judge).toEqual(scoresBefore);
});