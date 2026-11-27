import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { CriterionEvaluation } from "@/components/criterion-evaluation";
import { analyzePreview, createFolder, enqueuePreview, snapshot } from "@/lib/api";

vi.mock("@/components/ui/handoff-beam", () => ({
  HandoffBeam: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: ReactNode; to: string } & Record<string, unknown>) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

afterEach(cleanup);

let projectId = "";
beforeAll(async () => {
  createFolder("Criterion navigation test");
  const { project } = await analyzePreview("https://github.com/test/criterion-navigation", { stageMs: 0 });
  enqueuePreview(project.id);
  projectId = project.id;
});

function firstCriterion() {
  const state = snapshot();
  const criterion = state.criteria[0];
  const report = state.reports[projectId];
  if (!criterion || !report) throw new Error("Sample criterion and report are required");
  return { criterion, report };
}

describe("Judge criterion navigation buttons", () => {
  it("replaces the judge's note with back and continue buttons", () => {
    const { criterion, report } = firstCriterion();
    render(<CriterionEvaluation report={report} criterion={criterion} index={0} isFirst isLast={false} onBack={noop} onNext={noop} />);
    expect(screen.queryByLabelText(`${criterion.name} note`)).toBeNull();
    expect(screen.queryByText(/Judge's note/)).toBeNull();
  });

  it("disables back on the first criterion and moves forward with continue", () => {
    const { criterion, report } = firstCriterion();
    const onBack = vi.fn();
    const onNext = vi.fn();
    render(<CriterionEvaluation report={report} criterion={criterion} index={0} isFirst isLast={false} onBack={onBack} onNext={onNext} />);
    const back = screen.getByRole("button", { name: "Back" });
    expect(back).toBeDisabled();
    fireEvent.click(back);
    expect(onBack).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Continue to next criterion" }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("links to the results page on the last criterion", () => {
    const state = snapshot();
    const report = state.reports[projectId];
    const last = state.criteria[state.criteria.length - 1];
    if (!report || !last) throw new Error("Sample report and criterion are required");
    render(<CriterionEvaluation report={report} criterion={last} index={state.criteria.length - 1} isFirst={false} isLast onBack={noop} onNext={noop} />);
    const link = screen.getByRole("link", { name: "Continue to results" });
    expect(link.getAttribute("href")).toBe("/app/results");
    expect(screen.queryByRole("button", { name: "Continue to next criterion" })).toBeNull();
  });
});

const noop = () => {};
