import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { CriterionEvaluation } from "@/components/criterion-evaluation";
import { analyzePreview, createFolder, enqueuePreview, judgeTotal, snapshot } from "@/lib/api";

vi.mock("@/components/ui/handoff-beam", () => ({
  HandoffBeam: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

afterEach(cleanup);

const noop = () => {};

describe("Judge star scoring", () => {
  let projectId = "";
  beforeAll(async () => {
    createFolder("Star scoring test");
    const { project } = await analyzePreview("https://github.com/test/star-scoring", { stageMs: 0 });
    enqueuePreview(project.id);
    projectId = project.id;
  });
  it.each(Array.from({ length: 10 }, (_, i) => i + 1))("saves %i/10 when the judge chooses that star", (score) => {
    const state = snapshot();
    const criterion = state.criteria[0];
    const report = state.reports[projectId];
    if (!criterion || !report) throw new Error("Sample criterion and report are required");
    render(<CriterionEvaluation report={report} criterion={criterion} index={0} isFirst isLast={false} onBack={noop} onNext={noop} />);
    fireEvent.click(screen.getByRole("button", { name: `${criterion.name}: ${score} out of 10` }));
    expect(snapshot().judge[report.projectId]?.[criterion.id]?.score).toBe(score);
    expect(screen.getByRole("spinbutton", { name: `${criterion.name} final score` })).toHaveValue(score);
    fireEvent.click(screen.getByRole("button", { name: /Clear/ }));
    expect(snapshot().judge[report.projectId]?.[criterion.id]?.score).toBeUndefined();
  });
  it("keeps 7.5 AI recommendations out of ranking until a judge explicitly accepts", () => {
    const state = snapshot();
    const criterion = state.criteria[0]; const report = state.reports[projectId];
    if (!criterion || !report) throw new Error("Missing report");
    render(<CriterionEvaluation report={report} criterion={criterion} index={0} isFirst isLast={false} onBack={noop} onNext={noop} />);
    expect(report.drafts?.[criterion.id]?.[0]?.score).toBe(7.5);
    expect(snapshot().judge[projectId]?.[criterion.id]?.score).toBeUndefined();
    expect(judgeTotal({}, [criterion])).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Use AI suggestion" }));
    expect(snapshot().judge[projectId]?.[criterion.id]?.score).toBe(7.5);
    expect(screen.getByRole("spinbutton")).toHaveValue(7.5);
    fireEvent.click(screen.getByRole("button", { name: /Clear/ }));
  });
});
