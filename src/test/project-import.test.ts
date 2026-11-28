import { describe, expect, it } from "vitest";
import { parseImportFile, repositoryUrl } from "@/lib/project-import";

describe("project file import", () => {
  it("reads CSV project names, GitHub URLs and demos with quoted commas", () => {
    const result = parseImportFile("entries.csv", 'Project Name,GitHub Link,Demo URL\n"Notes, together",https://github.com/team/notes,https://notes.example\n');
    expect(result.items).toEqual([{ name: "Notes, together", repoUrl: "https://github.com/team/notes", demoUrl: "https://notes.example/" }]);
  });
  it("reads JSON arrays and projects exports", () => {
    expect(parseImportFile("entries.json", '[{"name":"Work","repoUrl":"https://github.com/team/work"}]').items[0]?.name).toBe("Work");
    expect(parseImportFile("entries.json", '{"projects":["https://github.com/team/work"]}').items[0]?.repoUrl).toBe("https://github.com/team/work");
  });
  it("extracts TXT repository links and normalizes duplicates", () => {
    const result = parseImportFile("entries.txt", 'Repo: https://github.com/team/work.git\nhttps://github.com/TEAM/work/\nhttps://github.com/team/second');
    expect(result.items.map((p) => p.repoUrl)).toEqual(["https://github.com/team/work", "https://github.com/team/second"]);
    expect(result.skipped).toBe(1);
  });
  it("skips unsupported projects without inventing repositories", () => {
    const result = parseImportFile("entries.json", '[{"name":"No repository","website":"https://example.com"},{"github":"https://github.com/team/real"}]');
    expect(result.items).toHaveLength(1); expect(result.skipped).toBe(1);
    expect(repositoryUrl("https://github.com/topics/hackathon")).toBeNull();
    expect(repositoryUrl("https://github.com.evil.example/team/project")).toBeNull();
  });
  it("rejects malformed or unsupported files", () => {
    expect(() => parseImportFile("entries.json", "{")).toThrow("Invalid JSON");
    expect(() => parseImportFile("entries.xlsx", "")).toThrow("CSV, JSON or TXT");
    expect(() => parseImportFile("entries.txt", "no repository here")).toThrow("No valid GitHub");
  });
});