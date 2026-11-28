import { createServerFn } from "@tanstack/react-start";
import type { Report, RuleCheck } from "./api";

export interface RepoData {
  repo: string;
  htmlUrl: string;
  description: string;
  license: string;
  createdAt: string;
  pushedAt: string;
  languages: string[];
  readme: string | null;
  commitDates: string[];
  commitsTruncated: boolean;
}
export type GhResult = { ok: true; data: RepoData } | { ok: false; message: string };

const WINDOW_START = Date.parse("2026-11-23T00:00:00Z");
const WINDOW_END = Date.parse("2026-11-30T08:00:00Z"); // 29 Nov 24:00 PST

/** Server only: the gateway URL is read here and never reaches the browser. */
export const analyzeGithubRepo = createServerFn({ method: "POST" })
  .inputValidator((url: string) => url)
  .handler(async ({ data: url }): Promise<GhResult> => {
    const m = /^https?:\/\/(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/.exec(url.trim());
    if (!m) return { ok: false, message: "That is not a GitHub repository URL. Use https://github.com/owner/repo." };
    const owner = m[1] ?? "";
    const repo = m[2] ?? "";
    const base = process.env.GH_GATEWAY;
    if (!base) return { ok: false, message: "The server is not set up for GitHub access." };
    const get = (path: string) =>
      fetch(`${base}/repos/${owner}/${repo}${path}`, {
        headers: { Accept: "application/vnd.github+json" },
        signal: AbortSignal.timeout(15000),
      });
    try {
      const r = await get("");
      if (r.status === 404) return { ok: false, message: "Repository not found, or it is private. Use a public repository." };
      if (r.status === 403 || r.status === 429) return { ok: false, message: "GitHub rate limit reached. Try again in a few minutes." };
      if (r.status === 401) return { ok: false, message: "The GitHub gateway rejected the request. Check the connector." };
      if (!r.ok) return { ok: false, message: `GitHub returned an error (${r.status}).` };
      const info = await r.json();
      if (info.private) return { ok: false, message: "This repository is private. Use a public repository." };
      const [lang, rd, cm] = await Promise.all([get("/languages"), get("/readme"), get("/commits?per_page=100")]);
      let readme: string | null = null;
      if (rd.ok) {
        const j = await rd.json();
        const bin = atob(String(j.content ?? "").replace(/\s/g, ""));
        readme = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
      }
      const commits: { commit?: { committer?: { date?: string }; author?: { date?: string } } }[] = cm.ok ? await cm.json() : [];
      const commitDates = commits
        .map((c) => c.commit?.committer?.date ?? c.commit?.author?.date ?? "")
        .filter(Boolean);
      return {
        ok: true,
        data: {
          repo: String(info.name ?? repo),
          htmlUrl: String(info.html_url ?? `https://github.com/${owner}/${repo}`),
          description: String(info.description ?? ""),
          license: String(info.license?.spdx_id ?? info.license?.name ?? "none declared"),
          createdAt: String(info.created_at ?? ""),
          pushedAt: String(info.pushed_at ?? ""),
          languages: lang.ok ? Object.keys(await lang.json()) : [],
          readme,
          commitDates,
          commitsTruncated: commitDates.length >= 100,
        },
      };
    } catch {
      return { ok: false, message: "Could not reach the GitHub gateway. Try again in a moment." };
    }
  });

const VIDEO = /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?[^\s)>\]"']+|youtu\.be\/[^\s)>\]"']+|loom\.com\/share\/[^\s)>\]"']+|vimeo\.com\/\d+[^\s)>\]"']*)/i;
const day = (iso: string) => iso.slice(0, 10);

function readmeLines(md: string): string[] {
  return md
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^(#|!\[|\[!\[|<|```)/.test(l) && !/^[-=*_]{3,}$/.test(l));
}

/** Turns real GitHub data into the Report shape the UI already uses. No model scores. */
export function buildReport(project: { id: string }, d: RepoData): Report {
  const lines = d.readme ? readmeLines(d.readme) : [];
  const lead = lines.slice(0, 3).join(" ").slice(0, 400);
  const n = d.commitDates.length;
  const newest = d.commitDates[0];
  const oldest = d.commitDates[n - 1];
  const demo = d.readme?.match(VIDEO)?.[0];
  const times = d.commitDates.map((x) => Date.parse(x));
  const outside = times.filter((t) => t < WINDOW_START || t > WINDOW_END).length;
  const cap = d.commitsTruncated ? " (latest 100 only)" : "";
  const warn = "warn" as const;
  const pass = "pass" as const;

  const checks: RuleCheck[] = [
    { id: "public", label: "Repository is public", result: pass, reason: "GitHub reports this repository as public.", evidenceUrl: d.htmlUrl },
    {
      id: "readme", label: "README exists", result: d.readme ? pass : warn,
      reason: d.readme ? "A README was found." : "No README was found.", evidenceUrl: `${d.htmlUrl}#readme`,
    },
    {
      id: "window", label: "Commits inside event window (23-29 Nov 2026)",
      result: n > 0 && outside === 0 ? pass : warn,
      reason: n === 0
        ? "No commits could be read. The judge should check."
        : outside === 0
          ? `All ${n} fetched commits are inside the window${cap}.`
          : `${outside} of ${n} fetched commits are dated outside the window${cap}. A flag, not a verdict.`,
      evidenceUrl: `${d.htmlUrl}/commits`,
    },
    {
      id: "demo", label: "Demo video link provided", result: demo ? pass : warn,
      reason: demo ? "A video link was found in the README." : "No YouTube, Loom or Vimeo link found in the README.",
      evidenceUrl: demo ?? d.htmlUrl,
    },
    {
      id: "connector", label: "Uses a Sprites connector", result: warn,
      reason: "Needs judge confirmation. This cannot be verified from GitHub alone.", evidenceUrl: d.htmlUrl,
    },
  ];

  return {
    projectId: project.id,
    summary: [
      `${d.repo} is a ${d.languages[0] ?? "software"} repository${d.description ? `: ${d.description.replace(/[.\s]+$/, "")}` : ""}.`,
      `GitHub shows ${n} commits in the fetched page${newest && oldest ? `, dated ${day(oldest)} to ${day(newest)}` : ""}${cap}.`,
      lead ? `The README begins: ${lead}` : "The repository has no readable README.",
    ],
    does: d.description || lead || "Not stated in the repository description or README.",
    doesNot: "Not checked: the code was not cloned or run, so working features are unverified.",
    stack: d.languages.slice(0, 6).map((name) => ({ name, kind: "language" as const })),
    checks,
    material: {
      description: {
        text: [d.description, `Created ${day(d.createdAt)}. Last push ${day(d.pushedAt)}. License: ${d.license}.`].filter(Boolean).join(" "),
        source: "GitHub repository data via Sprites GitHub connector",
      },
      repository: {
        readme: lines.slice(0, 8).join("\n").slice(0, 800) || "No README text found.",
        source: "GitHub README via Sprites GitHub connector",
        run: {
          status: "error",
          evidence: "Not run. GavelMind did not clone or execute this code.",
          log: [{ type: "info", text: "Repository data read through the GitHub connector. No code was executed." }],
        },
      },
      demo: {
        ...(demo ? { url: demo } : {}),
        transcriptStatus: "not provided",
        source: demo ? "Link found in README" : "No video link found in README",
      },
    },
    models: [],
  };
}
