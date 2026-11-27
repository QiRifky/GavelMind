import { describe, expect, it } from "vitest";
import { createFolder, snapshot } from "@/lib/api";

describe("new user workspace", () => {
  it("starts with no event folders or sample judging data", () => {
    const state = snapshot();
    expect(state.folders).toEqual([]);
    expect(state.activeFolderId).toBe("");
    expect(state.event).toBeNull();
    expect(state.projects).toEqual([]);
    expect(state.reports).toEqual({});
    expect(state.judge).toEqual({});
    expect(state.log).toEqual([]);
    expect(state.winners).toEqual([]);
    expect(state.finalized).toBe(false);
  });

  it("creates the first real folder without restoring sample data", () => {
    const id = createFolder("My first event");
    const state = snapshot();
    expect(state.folders.map((folder) => ({ id: folder.id, name: folder.name }))).toEqual([{ id, name: "My first event" }]);
    expect(state.activeFolderId).toBe(id);
    expect(state.projects).toEqual([]);
    expect(state.reports).toEqual({});
    expect(state.event).toBeNull();
    expect(state.criteria.map((criterion) => criterion.name)).toEqual(["Creativity", "Usefulness", "Technical quality", "Demo clarity"]);
  });
});