import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Entries } from "@/routes/app.entries";
import { analyzePreview, createFolder, enqueuePreview, saveJudgeScore, snapshot } from "@/lib/api";

vi.mock("@/components/ui/handoff-beam", () => ({
  HandoffBeam: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: unknown) => config,
  Link: ({ children, to, ...props }: { children: ReactNode; to: string } & Record<string, unknown>) => (
    <a href={typeof to === "string" ? to : "#"} {...props}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
}));

afterEach(cleanup);

let projectId = "";
beforeAll(async () => {
  createFolder("Entries judged status");
  const { project } = await analyzePreview("https://github.com/test/judged-status", { stageMs: 0 });
  enqueuePreview(project.id);
  projectId = project.id;
});

describe("Judged status in the project queue", () => {
  it("marks a ready project as not reviewed until the judge scores it", () => {
    render(<Entries />);
    expect(screen.getByText("Not reviewed")).toBeInTheDocument();
    expect(screen.queryByText("In review")).toBeNull();
  });

  it("switches to in review as soon as the judge saves one score", () => {
    const criterion = snapshot().criteria[0];
    if (!criterion) throw new Error("Sample criterion is required");
    saveJudgeScore(projectId, criterion.id, { score: 7 });
    render(<Entries />);
    expect(screen.getByText("In review")).toBeInTheDocument();
    expect(screen.queryByText("Not reviewed")).toBeNull();
  });
});
