import { describe, expect, it } from "vitest";
import { addProjects, createFolder, snapshot, switchFolder } from "@/lib/api";

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
});
