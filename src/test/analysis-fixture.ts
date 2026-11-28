import type { AnalysisInput, RepositoryEvidence } from "@/lib/analysis";
import { reportFromAnalysis } from "@/lib/analysis";

export function fixtureReport(input: AnalysisInput) {
  const repo: RepositoryEvidence = { name: "test/project", url: input.project.repoUrl, description: "Test fixture only", languages: ["TypeScript"], readme: "Test fixture source material.", commits: [], commitsTruncated: false, documents: [{ path: "README.md", url: `${input.project.repoUrl}/blob/main/README.md`, text: "Test fixture source material." }] };
  return reportFromAnalysis(input, repo, "test-model", { summary: ["Fixture summary.", "Not production data.", "No code executed."], does: "Fixture behavior.", doesNot: "Unverified.", drafts: input.criteria.map((criterion) => ({ criterionId: criterion.id, score: 7.5, reason: "Test fixture assessment.", sourcePath: "README.md", quote: "Test fixture source material." })) });
}