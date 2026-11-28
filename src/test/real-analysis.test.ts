import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeRepository } from "@/lib/analysis.functions";
import { analyzePreview, addProjects, analyzeProject, draftsFor, scanShowcase, snapshot, judgeTotal } from "@/lib/api";
import { reportFromAnalysis, type AnalysisInput, type RepositoryEvidence } from "@/lib/analysis";

const input: AnalysisInput = { project: { id: "real", repoUrl: "https://github.com/test/real" }, criteria: [{ id: "creativity", name: "Creativity", weight: 100 }] };
const repo: RepositoryEvidence = { name: "test/real", url: input.project.repoUrl, description: "A source test", languages: ["TypeScript"], readme: "Public README text.", commits: [], commitsTruncated: false, documents: [{ path: "README.md", url: `${input.project.repoUrl}/blob/main/README.md`, text: "Public README text." }] };
const output = () => ({ summary: ["Source test.", "Documentation available.", "Execution unverified."], does: "Documents a source test.", doesNot: "Unknown runtime behavior.", drafts: [{ criterionId: "creativity", score: 7.5, reason: "Documented concept only.", sourcePath: "README.md", quote: "Public README text." }] });
afterEach(() => vi.clearAllMocks());

describe("real analysis without fabricated fallback", () => {
  it("stores only returned model scores and real source quotes, with execution explicitly not run", () => {
    const report = reportFromAnalysis(input, repo, "google/gemini-3.8-flash", output());
    expect(draftsFor(report, input.criteria[0] ?? { id: "missing", name: "missing", weight: 100 })[0]).toEqual({ model: "google/gemini-3.8-flash", score: 7.5, reason: "Documented concept only.", evidence: `${repo.documents[0]?.url}\nQuote: Public README text.` });
    expect(report.material.repository.run.status).toBe("not run");
    expect(report.checks.find((check) => check.id === "runs")?.result).toBe("warn");
    expect(judgeTotal({}, input.criteria)).toBeNull();
  });
  it("rejects a fabricated evidence quote", () => {
    const data = output(); data.drafts[0] = { criterionId: "creativity", score: 7.5, reason: "Invented", sourcePath: "README.md", quote: "Never present in source" };
    expect(() => reportFromAnalysis(input, repo, "Gemini", data)).toThrow("unsupported evidence");
  });
  it("accepts a real quote with different whitespace, wrapping quotes and ./ path", () => {
    const data = output(); data.drafts[0] = { criterionId: "Creativity", score: 7.5, reason: "ok", sourcePath: "./README.md", quote: "\u201cPublic  README\ntext.\u201d" };
    expect(reportFromAnalysis(input, repo, "Groq", data).drafts?.["creativity"]?.[0]?.reason).toBe("ok");
  });
  it("cites the real file when the AI names a wrong path for a real quote", () => {
    const data = output(); data.drafts[0] = { criterionId: "creativity", score: 7.5, reason: "Invented", sourcePath: "fake.ts", quote: "Public README text." };
    expect(reportFromAnalysis(input, repo, "Gemini", data).drafts?.["creativity"]?.[0]?.evidence).toContain("README.md");
  });
  it("requires a numeric recommendation for every criterion", () => {
    const data = output(); const first = data.drafts[0]; if (!first) throw new Error("Missing fixture");
    const { score: _score, ...withoutScore } = first;
    expect(() => reportFromAnalysis(input, repo, "Groq", { ...data, drafts: [withoutScore] })).toThrow();
  });
  it.each([0, 10.5, NaN, Infinity])("rejects invalid recommendation %s outside 1–10", (score) => {
    const data = output(); const first = data.drafts[0]; if (!first) throw new Error("Missing fixture");
    first.score = score;
    expect(() => reportFromAnalysis(input, repo, "Groq", data)).toThrow();
  });
  it("does not substitute scores after a rubric rename", () => {
    const report = reportFromAnalysis(input, repo, "Gemini", output());
    expect(draftsFor(report, { id: "creativity", name: "Usefulness", weight: 100 })).toEqual([]);
  });
  it("does not create preview reports when services fail", async () => {
    vi.mocked(analyzeRepository).mockResolvedValueOnce({ ok: false, message: "GitHub access denied" });
    const before = snapshot().reports;
    await expect(analyzePreview("https://github.com/test/failed-real")).rejects.toThrow("GitHub access denied");
    expect(snapshot().reports).toBe(before);
  });
  it("marks a queued entry failed without inserting a mock report", async () => {
    const project = addProjects(["https://github.com/test/failed-queued"])[0];
    if (!project) throw new Error("Missing project");
    vi.mocked(analyzeRepository).mockResolvedValueOnce({ ok: false, message: "AI unavailable" });
    await expect(analyzeProject(project.id)).rejects.toThrow("AI unavailable");
    expect(snapshot().reports[project.id]).toBeUndefined();
    expect(snapshot().projects.find((row) => row.id === project.id)?.status).toBe("failed");
  });
  it("never creates invented showcase entries", async () => {
    const before = snapshot().projects;
    await expect(scanShowcase("https://example.com/showcase")).rejects.toThrow("No direct GitHub");
    expect(snapshot().projects).toBe(before);
  });
});