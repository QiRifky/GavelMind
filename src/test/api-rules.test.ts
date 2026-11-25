import { describe, expect, it, vi } from "vitest";
import { addProjects, analyzeProject, exportResults, leaderboard, saveJudgeScore, saveRubric, snapshot } from "../lib/api";

describe("judging rules", () => {
  it("never ranks a project from AI drafts alone", () => {
    const { ranked, waiting } = leaderboard(snapshot());
    expect(ranked).toHaveLength(0);
    expect(waiting.length).toBeGreaterThan(0);
  });
  it("ranks once the judge scores every criterion", async () => {
    for (const c of snapshot().criteria) await saveJudgeScore("p2", c.id, { score: 8 });
    const { ranked } = leaderboard(snapshot());
    expect(ranked.map((r) => r.p.id)).toEqual(["p2"]);
    expect(ranked[0]?.total).toBe(8);
  });
  it("logs old and new values for every judge edit", async () => {
    const c = snapshot().criteria[0]!;
    await saveJudgeScore("p2", c.id, { score: 6 });
    expect(snapshot().log[0]).toMatchObject({ oldValue: "8", newValue: "6" });
  });
  it("refuses a rubric whose weights don't total 100%", async () => {
    await expect(saveRubric([{ id: "x", name: "X", weight: 90 }])).rejects.toThrow();
  });
  it("exports include the drafts disclaimer", () => {
    for (const f of ["csv", "json", "md"] as const) expect(exportResults(f).content).toContain("AI scores are drafts; final scores are the judge's decisions.");
  });
  it("marks a non-repository URL as failed", async () => {
    vi.useFakeTimers();
    const [id] = addProjects("https://example.com/not-a-repo");
    const run = analyzeProject(id!, { stageMs: 10 });
    const caught = run.catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(50);
    expect(await caught).toBeInstanceOf(Error);
    expect(snapshot().projects.find((p) => p.id === id)?.status).toBe("failed");
    vi.useRealTimers();
  });
});
