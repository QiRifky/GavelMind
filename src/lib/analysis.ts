import { z } from "zod";
import type { Criterion, ModelDraft, Report } from "./api";

export const analysisInput = z.object({
  project: z.object({ id: z.string().min(1).max(100), repoUrl: z.string().url().max(500) }),
  criteria: z.array(z.object({ id: z.string().min(1).max(100), name: z.string().min(1).max(120), weight: z.number().min(0).max(100) })).min(1).max(20),
});
export type AnalysisInput = z.infer<typeof analysisInput>;
export type AnalysisResult = { ok: true; report: Report } | { ok: false; message: string };
export interface SourceDocument { path: string; url: string; text: string }
export interface RepositoryEvidence {
  name: string; url: string; description: string; languages: string[];
  readme: string; commits: string[]; commitsTruncated: boolean; documents: SourceDocument[];
}
const outputSchema = z.object({
  summary: z.tuple([z.string().min(1).max(1000), z.string().min(1).max(1000), z.string().min(1).max(1000)]),
  does: z.string().min(1).max(1500),
  doesNot: z.string().min(1).max(1500),
  drafts: z.array(z.object({
    criterionId: z.string(), reason: z.string().min(1).max(2000),
    sourcePath: z.string(), quote: z.string().min(1).max(1000),
  })),
});

const normPath = (p: string) => p.trim().replace(/^\.?\//, "").toLowerCase();
/** Compare quotes ignoring whitespace, quote-mark style and wrapping quotes; content must still match. */
export const normText = (t: string) => t.replace(/[\u2018\u2019\u201B`]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\s+/g, " ").trim().replace(/^["']+|["']+$/g, "").replace(/[.…]+$/, "").trim().toLowerCase();
/** Accept drafts only for the requested rubric and exact quotations from fetched sources. */
export function reportFromAnalysis(input: AnalysisInput, repo: RepositoryEvidence, model: string, output: unknown): Report {
  const parsed = outputSchema.parse(output);
  const drafts: Record<string, ModelDraft[]> = {};
  const draftCriteria: Record<string, string> = {};
  for (const criterion of input.criteria) {
    const key = (v: string) => v.trim().toLowerCase();
    const matches = parsed.drafts.filter((d) => key(d.criterionId) === key(criterion.id) || key(d.criterionId) === key(criterion.name));
    const draft = matches[0];
    if (!draft) throw new Error("The AI did not return the complete rubric. Retry analysis.");
    const path = normPath(draft.sourcePath);
    const source = repo.documents.find((doc) => normPath(doc.path) === path) ?? repo.documents.find((doc) => normText(doc.text).includes(normText(draft.quote)));
    if (matches.length !== 1 || !source || !normText(draft.quote) || !normText(source.text).includes(normText(draft.quote))) {
      throw new Error("The AI returned unsupported evidence. Retry analysis or review the repository manually.");
    }
    drafts[criterion.id] = [{ model, reason: draft.reason, evidence: `${source.url}\nQuote: ${draft.quote}` }];
    draftCriteria[criterion.id] = criterion.name;
  }
  return {
    projectId: input.project.id, summary: parsed.summary, does: parsed.does,
    doesNot: `${parsed.doesNot}\nNot verified: execution, deployed behavior, and video content. Only fetched repository material was reviewed.`,
    stack: repo.languages.map((name) => ({ name, kind: "language" })),
    checks: [
      { id: "public", label: "Repository is public", result: "pass", reason: "GitHub returned this public repository.", evidenceUrl: repo.url },
      { id: "readme", label: "README available", result: repo.readme ? "pass" : "warn", reason: repo.readme ? "README content was retrieved from GitHub." : "No readable README was retrieved.", evidenceUrl: `${repo.url}#readme` },
      { id: "runs", label: "Runs successfully", result: "warn", reason: "Not verified — no repository code was executed.", evidenceUrl: repo.url },
    ],
    material: {
      description: { text: repo.description || "No repository description provided.", source: repo.url },
      repository: {
        readme: repo.readme || "No README retrieved.", source: `${repo.url}#readme`,
        run: { status: "not run", evidence: `Read ${repo.documents.length} source documents; fetched ${repo.commits.length} commit dates${repo.commitsTruncated ? " (history incomplete)" : ""}. No code was executed.`, log: repo.documents.map((doc) => ({ type: "info", text: `Retrieved ${doc.path} from ${doc.url}` })) },
      },
      demo: { transcriptStatus: "not provided", source: "No video was fetched or transcribed." },
    },
    models: [model], drafts, draftCriteria,
  };
}

export function storedDrafts(report: Report, criterion: Criterion): ModelDraft[] {
  return report.draftCriteria?.[criterion.id] === criterion.name ? report.drafts?.[criterion.id] ?? [] : [];
}