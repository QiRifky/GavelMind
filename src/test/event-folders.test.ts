import { describe, expect, it } from "vitest";
import { addProjects, createFolder, extractEventRules, saveEvent, snapshot, switchFolder } from "@/lib/api";

describe("event folders", () => {
  it("keeps each folder's projects separate", () => {
    const first = snapshot().activeFolderId;
    const before = snapshot().projects.length;
    createFolder("Second event");
    expect(snapshot().projects).toHaveLength(0);
    addProjects(["https://github.com/a/b"]);
    expect(snapshot().projects).toHaveLength(1);
    switchFolder(first);
    expect(snapshot().projects).toHaveLength(before);
  });
  it("keeps event details and sample rule drafts inside their own folder", async () => {
    const first = snapshot().activeFolderId;
    const originalEvent = snapshot().event;
    const created = createFolder("Build Together 2026");
    saveEvent("Build Together 2026", "https://example.com/build-together");
    await extractEventRules();
    expect(snapshot().activeFolderId).toBe(created);
    expect(snapshot().event?.name).toBe("Build Together 2026");
    expect(snapshot().event?.url).toBe("https://example.com/build-together");
    expect(snapshot().event?.rules).toHaveLength(4);
    expect(snapshot().event?.confirmed).toBe(false);
    switchFolder(first);
    expect(snapshot().event).toEqual(originalEvent);
    switchFolder(created);
    expect(snapshot().event?.name).toBe("Build Together 2026");
    switchFolder(first);
  });
});
