import { describe, expect, it } from "vitest";
import { addProjects, analyzePreview, createFolder, enqueuePreview, prepareJudging, snapshot, switchFolder } from "@/lib/api";

describe("explicit project queue", () => {
  it("adds a single-analysis project only when its preview is accepted, with no duplicates", async () => {
    const before = snapshot().projects.length;
    const { project, report } = await analyzePreview("https://github.com/queue-test/preview", { stageMs: 0 });
    expect(snapshot().projects).toHaveLength(before);
    expect(snapshot().reports[project.id]).toBeUndefined();
    enqueuePreview(project.id);
    expect(snapshot().projects).toHaveLength(before + 1);
    expect(snapshot().reports[project.id]).toEqual(report);
    expect(snapshot().projects.find((p) => p.id === project.id)?.status).toBe("done");
    enqueuePreview(project.id);
    expect(snapshot().projects).toHaveLength(before + 1);
  });

  it("opens a selected project and preserves its ready report", async () => {
    const { project } = await analyzePreview("https://github.com/queue-test/selected", { stageMs: 0 });
    enqueuePreview(project.id);
    const report = snapshot().reports[project.id];
    expect(await prepareJudging([project.id], { stageMs: 0 })).toBe(project.id);
    expect(snapshot().reports[project.id]).toBe(report);
  });

  it("prepares missing material for selected queued entries before judging", async () => {
    const [selected, other] = addProjects(["https://github.com/queue-test/queued", "https://github.com/queue-test/unselected"]);
    if (!selected || !other) throw new Error("Expected two projects");
    expect(await prepareJudging([selected.id], { stageMs: 0 })).toBe(selected.id);
    expect(snapshot().projects.find((p) => p.id === selected.id)?.status).toBe("done");
    expect(snapshot().reports[selected.id]?.projectId).toBe(selected.id);
    expect(snapshot().projects.find((p) => p.id === other.id)?.status).toBe("queued");
    expect(snapshot().reports[other.id]).toBeUndefined();
    await expect(prepareJudging([], { stageMs: 0 })).rejects.toThrow("Select a project first.");
  });

  it("does not add a preview to a different event folder", async () => {
    const folderId = snapshot().activeFolderId;
    const { project } = await analyzePreview("https://github.com/queue-test/scoped", { stageMs: 0 });
    createFolder("Other queue event");
    try {
      expect(() => enqueuePreview(project.id)).toThrow("current event");
      expect(snapshot().projects).toHaveLength(0);
    } finally { switchFolder(folderId); }
  });
});