// All app data flows through this file. It is an in-memory mock with simulated delays.
// Replace the bodies of the exported async functions with real backend calls later; keep the shapes.
import { useSyncExternalStore } from "react";

export const API_BASE_URL: string = import.meta.env["VITE_API_BASE_URL"] ?? "";

/* ---------- Types ---------- */

/** Pipeline status of a project's analysis. */
export type EntryStatus = "queued" | "analyzing" | "done" | "failed";
/** Where the judge is with a project. Derived, never stored. */
export type JudgeStatus = "Not reviewed" | "In review" | "Finalized";
export type RunStatus = "worked" | "failed" | "error";
export type CheckResult = "pass" | "warning" | "fail";
/** Wording style of the written summary. Never affects numbers. */
export type SummaryTone = "neutral" | "concise" | "detailed";
export type TranscriptStatus = "not provided" | "transcribing" | "ready";
export type ExportFormat = "csv" | "json" | "md";

export interface Project { id: string; name: string; repoUrl: string; demoUrl?: string; status: EntryStatus; error?: string }
export interface Criterion { id: string; name: string; weight: number }
export interface LogLine { type: "cmd" | "ok" | "info" | "warn" | "error" | "result"; text: string }
export interface RuleCheck { id: string; label: string; result: CheckResult; reason: string; evidenceUrl: string }
/** One model's draft for one criterion. `model` comes from the API; components never hard-code names. */
export interface ModelDraft { model: string; score: number; reason: string; evidence: string }
export interface CriterionDraft { criterionId: string; drafts: ModelDraft[]; average: number; agree: boolean }
export interface Sourced<T> { value: T; source: string }
export interface Report {
  projectId: string;
  models: string[];
  summary: Record<SummaryTone, string[]>;
  stack: string[];
  does: string[];
  doesNot: string[];
  checks: RuleCheck[];
  material: {
    description: Sourced<string>;
    repository: { readme: Sourced<string>; stack: Sourced<string[]>; run: Sourced<{ status: RunStatus; log: LogLine[] }> };
    demo: { url?: string; transcriptStatus: TranscriptStatus; transcript?: string; source: string };
  };
  drafts: CriterionDraft[];
}
export interface ChangeLogItem { id: number; at: number; what: string; oldValue: string; newValue: string }
export interface Discovered { name: string; repoUrl: string; demoUrl?: string }

interface State {
  projects: Project[];
  criteria: Criterion[];
  reports: Record<string, Report>;
  finals: Record<string, Record<string, number>>;
  notes: Record<string, Record<string, string>>;
  log: ChangeLogItem[];
  finalized: boolean;
  winners: string[];
}

/* ---------- Mock data ---------- */

const MODELS = ["Claude Sonnet 4.5", "GPT-5", "Gemini 2.5 Pro"];
const REPO_RE = /^https?:\/\/(www\.)?github\.com\/[^/\s]+\/[^/\s]+\/?$/;

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}
const nameOf = (url: string) => url.replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\/$/, "");

function runLog(run: RunStatus): LogLine[] {
  const base: LogLine[] = [{ type: "info", text: "Cloning repository into isolated sandbox" }, { type: "cmd", text: "npm install" }];
  if (run === "failed") return [...base, { type: "error", text: "npm ERR! 404 package not found in registry" }, { type: "result", text: "Result: failed — install did not complete" }];
  const built: LogLine[] = [...base, { type: "ok", text: "Dependencies installed" }, { type: "cmd", text: "npm run build" }, { type: "ok", text: "Build finished" }, { type: "cmd", text: "npm start" }];
  if (run === "error") return [...built, { type: "error", text: "TypeError: cannot read 'map' of undefined (src/App.tsx:42)" }, { type: "result", text: "Result: error — crashed at runtime" }];
  return [...built, { type: "ok", text: "GET / → 200 in 412 ms" }, { type: "result", text: "Result: worked" }];
}

function makeDrafts(p: Project, criteria: Criterion[]): CriterionDraft[] {
  return criteria.map((c) => {
    const drafts = MODELS.map((model) => {
      const score = 4 + (hash(p.id + c.name + model) % 6);
      return {
        model,
        score,
        reason: score >= 7 ? `Clear strengths in ${c.name.toLowerCase()} across the main flow.` : `${c.name} shows up, but only in parts of the project.`,
        evidence: `README.md and ${(hash(model + c.id) % 20) + 3} files in src/`,
      };
    });
    const scores = drafts.map((d) => d.score);
    const average = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
    return { criterionId: c.id, drafts, average, agree: Math.max(...scores) - Math.min(...scores) <= 1 };
  });
}

function makeReport(p: Project, criteria: Criterion[]): Report {
  const n = hash(p.id);
  const run: RunStatus = (["worked", "error", "worked", "failed"] as const)[n % 4] ?? "worked";
  const stack = ["TypeScript", "React", n % 2 ? "Postgres" : "SQLite", "Vite"];
  const repo = p.repoUrl.replace(/\/$/, "");
  const transcriptStatus: TranscriptStatus = p.demoUrl ? (n % 3 === 0 ? "transcribing" : "ready") : "not provided";
  return {
    projectId: p.id,
    models: MODELS,
    summary: {
      neutral: [
        `${p.name} is a web app with a React front end and one small API service.`,
        `The main flow works end to end; two secondary screens are stubbed.`,
        `Tests cover a few helper functions only.`,
      ],
      concise: [`React app plus one API.`, `Main flow complete, extras stubbed.`, `Few tests.`],
      detailed: [
        `${p.name} is a web app whose React front end talks to a single API service that stores data in ${stack[2]}.`,
        `The primary flow described in the README is implemented end to end, while the settings and sharing screens render placeholders.`,
        `Automated tests exist for three helper modules; no test exercises the API or the UI.`,
      ],
    },
    stack,
    does: ["Lets a user sign up and save items", "Shows saved items in a list with search"],
    doesNot: ["Share items with other users", "Work offline"],
    checks: [
      { id: "event", label: "Built during the event", result: n % 2 ? "warning" : "pass", reason: n % 2 ? "First commit is 2 days before the event window." : "All commits fall inside the event window.", evidenceUrl: `${repo}/commits` },
      { id: "connector", label: "Uses a required connector", result: n % 3 === 0 ? "pass" : "fail", reason: n % 3 === 0 ? "src/lib/calendar.ts calls a connected calendar." : "No connector call found in the code.", evidenceUrl: `${repo}/search?q=connector` },
      { id: "demo", label: "Demo provided", result: p.demoUrl ? "pass" : "fail", reason: p.demoUrl ? "Demo video link supplied." : "No demo video link.", evidenceUrl: p.demoUrl ?? `${repo}#readme` },
      { id: "public", label: "Repo is public", result: "pass", reason: "Repository cloned without credentials.", evidenceUrl: repo },
      { id: "runs", label: "Runs successfully", result: run === "worked" ? "pass" : run === "error" ? "warning" : "fail", reason: run === "worked" ? "Started and answered HTTP 200." : run === "error" ? "Built, then crashed on first request." : "Install failed; never started.", evidenceUrl: `${repo}/blob/main/package.json` },
    ],
    material: {
      description: { value: `${p.name}: a tool that helps people keep track of the things they save and find them again quickly.`, source: "Submission form" },
      repository: {
        readme: { value: "Setup: npm install, npm start. Describes the save-and-search flow and lists two planned features.", source: "README.md" },
        stack: { value: stack, source: "package.json" },
        run: { value: { status: run, log: runLog(run) }, source: "Sandbox run" },
      },
      demo: {
        ...(p.demoUrl ? { url: p.demoUrl } : {}),
        transcriptStatus,
        ...(transcriptStatus === "ready" ? { transcript: "Hi, this is our project. You sign up, save an item, then search for it. Next we want to add sharing." } : {}),
        source: p.demoUrl ? "Demo video" : "Not provided",
      },
    },
    drafts: makeDrafts(p, criteria),
  };
}

const seed: Project[] = [
  { id: "p1", name: "lumen-labs/plantpal", repoUrl: "https://github.com/lumen-labs/plantpal", demoUrl: "https://youtu.be/plantpal-demo", status: "done" },
  { id: "p2", name: "quietbyte/transit-whisper", repoUrl: "https://github.com/quietbyte/transit-whisper", status: "done" },
  { id: "p3", name: "ada-team/receipt-ninja", repoUrl: "https://github.com/ada-team/receipt-ninja", demoUrl: "https://youtu.be/receipt-ninja", status: "done" },
];
const seedCriteria: Criterion[] = [
  { id: "c1", name: "Creativity", weight: 25 },
  { id: "c2", name: "Usefulness", weight: 25 },
  { id: "c3", name: "Technical quality", weight: 25 },
  { id: "c4", name: "Demo clarity", weight: 25 },
];

let state: State = {
  projects: seed,
  criteria: seedCriteria,
  reports: Object.fromEntries(seed.map((p) => [p.id, makeReport(p, seedCriteria)])),
  finals: {},
  notes: {},
  log: [],
  finalized: false,
  winners: [],
};

/* ---------- Store plumbing ---------- */

const listeners = new Set<() => void>();
function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};
/** Live, synchronous view of the store for rendering. */
export function useApi() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}
/** Read-only snapshot for tests; never mutate. */
export function snapshot(): State {
  return state;
}

let logId = 0;
function log(what: string, oldValue: string, newValue: string) {
  set({ log: [{ id: ++logId, at: Date.now(), what, oldValue, newValue }, ...state.log] });
}
function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Cancelled", "AbortError"));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => { clearTimeout(t); reject(new DOMException("Cancelled", "AbortError")); }, { once: true });
  });
}
function patchProject(id: string, patch: Partial<Project>) {
  set({ projects: state.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
}

/* ---------- Pure helpers ---------- */

/** Weighted judge total from final scores only; null until every criterion has a final score. */
export function judgeTotal(finals: Record<string, number> | undefined, criteria: Criterion[]): number | null {
  if (!finals || criteria.length === 0) return null;
  let sum = 0;
  let w = 0;
  for (const c of criteria) {
    const v = finals[c.id];
    if (v === undefined) return null;
    sum += v * c.weight;
    w += c.weight;
  }
  return w === 0 ? null : sum / w;
}
/** Weighted total of AI draft averages. Display only; never used for ranking. */
export function draftTotal(report: Report | undefined, criteria: Criterion[]): number | null {
  if (!report || criteria.length === 0) return null;
  let sum = 0;
  let w = 0;
  for (const c of criteria) {
    const d = report.drafts.find((x) => x.criterionId === c.id);
    if (!d) continue;
    sum += d.average * c.weight;
    w += c.weight;
  }
  return w === 0 ? null : sum / w;
}
export function judgeStatusOf(s: Pick<State, "finals" | "finalized" | "criteria">, id: string): JudgeStatus {
  const row = s.finals[id];
  if (!row || Object.keys(row).length === 0) return "Not reviewed";
  return s.finalized && judgeTotal(row, s.criteria) !== null ? "Finalized" : "In review";
}
/** Ranked rows (judge totals only) plus projects still awaiting review. */
export function leaderboard(s: State) {
  const rows = s.projects.filter((p) => p.status === "done").map((p) => ({ p, total: judgeTotal(s.finals[p.id], s.criteria) }));
  return {
    ranked: rows.filter((r) => r.total !== null).sort((a, b) => (b.total ?? 0) - (a.total ?? 0)),
    waiting: rows.filter((r) => r.total === null),
  };
}

/* ---------- API ---------- */

export const ANALYZE_STAGES = [
  { label: "Cloning repository", line: "Copying the code into an isolated sandbox." },
  { label: "Running in sandbox", line: "Installing dependencies and starting the app." },
  { label: "Checking rules", line: "Comparing commits, connectors and demo against the event rules." },
  { label: "Drafting scores", line: "Each model drafts a score per criterion with evidence." },
] as const;

export async function listProjects(): Promise<Project[]> {
  await wait(250);
  return state.projects;
}

/** Adds one project per line (repo or project page URL). Returns the new ids. */
export function addProjects(text: string, demoUrls: Record<string, string> = {}): string[] {
  const urls = text.split(/[\s,]+/).map((u) => u.trim()).filter(Boolean);
  const known = new Set(state.projects.map((p) => p.repoUrl));
  const fresh: Project[] = urls.filter((u) => !known.has(u)).map((url) => {
    const demo = demoUrls[url];
    return { id: `p${hash(url + Date.now() + Math.random())}`, repoUrl: url, name: nameOf(url), status: "queued", ...(demo ? { demoUrl: demo } : {}) };
  });
  set({ projects: [...state.projects, ...fresh] });
  return fresh.map((p) => p.id);
}
export function removeProject(id: string) {
  set({ projects: state.projects.filter((p) => p.id !== id) });
}

/** Mock: finds projects listed on a showcase page. */
export async function scanShowcase(pageUrl: string): Promise<Discovered[]> {
  await wait(900);
  if (!/^https?:\/\//.test(pageUrl)) throw new Error("Enter a full page URL starting with https://");
  const h = hash(pageUrl);
  const teams = ["orbit-crew/notesync", "pixel-pals/mood-map", "byte-bakers/recipe-radar", "north-dev/bike-buddy", "kite-lab/study-sprint"];
  return teams.slice(0, 3 + (h % 3)).map((t, i) => ({ name: t, repoUrl: `https://github.com/${t}`, ...(i % 2 === 0 ? { demoUrl: `https://youtu.be/${t.split("/")[1]}` } : {}) }));
}

/** Runs the analysis pipeline. Calls onStage(0..3); rejects with AbortError on cancel. */
export async function analyzeProject(id: string, opts: { onStage?: (i: number) => void; signal?: AbortSignal; stageMs?: number } = {}): Promise<Report> {
  const p = state.projects.find((x) => x.id === id);
  if (!p) throw new Error("Project not found");
  const prev = p.status;
  patchProject(id, { status: "analyzing" });
  const { error: _e, ...clean } = p;
  try {
    for (let i = 0; i < ANALYZE_STAGES.length; i++) {
      opts.onStage?.(i);
      await wait(opts.stageMs ?? 1100, opts.signal);
      if (i === 0 && !REPO_RE.test(p.repoUrl)) {
        const error = "Couldn't clone: this isn't a public GitHub repository URL.";
        set({ projects: state.projects.map((x) => (x.id === id ? { ...clean, status: "failed", error } : x)) });
        throw new Error(error);
      }
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") patchProject(id, { status: prev === "analyzing" ? "queued" : prev });
    throw e;
  }
  const report = makeReport(p, state.criteria);
  set({ reports: { ...state.reports, [id]: report }, projects: state.projects.map((x) => (x.id === id ? { ...clean, status: "done" } : x)) });
  return report;
}

export async function getReport(id: string): Promise<Report> {
  await wait(350);
  const r = state.reports[id];
  if (!r) throw new Error("No report yet. Analyze this project first.");
  return r;
}

/** Autosaves a judge's final score (0-10, null clears) and/or note. Ignored after finalizing. */
export async function saveJudgeScore(projectId: string, criterionId: string, change: { score?: number | null; note?: string }): Promise<void> {
  if (state.finalized) return;
  const p = state.projects.find((x) => x.id === projectId);
  const c = state.criteria.find((x) => x.id === criterionId);
  const label = `${p?.name ?? projectId} · ${c?.name ?? criterionId}`;
  if (change.score !== undefined) {
    const prev = state.finals[projectId]?.[criterionId];
    const next = change.score === null ? undefined : Math.min(10, Math.max(0, change.score));
    if (prev !== next) {
      const row = { ...(state.finals[projectId] ?? {}) };
      if (next === undefined) delete row[criterionId];
      else row[criterionId] = next;
      set({ finals: { ...state.finals, [projectId]: row } });
      log(`Score changed: ${label}`, prev === undefined ? "—" : String(prev), next === undefined ? "—" : String(next));
    }
  }
  if (change.note !== undefined) {
    const prev = state.notes[projectId]?.[criterionId] ?? "";
    if (prev !== change.note) {
      set({ notes: { ...state.notes, [projectId]: { ...(state.notes[projectId] ?? {}), [criterionId]: change.note } } });
      log(prev ? `Note edited: ${label}` : `Note added: ${label}`, prev || "—", change.note || "—");
    }
  }
}

export async function getRubric(): Promise<Criterion[]> {
  await wait(150);
  return state.criteria;
}
export const weightSum = (cs: Criterion[]) => cs.reduce((a, c) => a + c.weight, 0);

/** Saves the whole rubric; weights must total 100. Logs each difference. */
export async function saveRubric(next: Criterion[]): Promise<void> {
  if (weightSum(next) !== 100) throw new Error("Weights must total 100%.");
  await wait(300);
  const old = state.criteria;
  for (const c of next) {
    const o = old.find((x) => x.id === c.id);
    if (!o) log("Rubric changed: added criterion", "—", `${c.name} (${c.weight}%)`);
    else {
      if (o.name !== c.name) log("Rubric changed: renamed criterion", o.name, c.name);
      if (o.weight !== c.weight) log(`Rubric changed: weight of ${c.name}`, `${o.weight}%`, `${c.weight}%`);
    }
  }
  for (const o of old) if (!next.find((x) => x.id === o.id)) log("Rubric changed: removed criterion", o.name, "—");
  const reports = Object.fromEntries(Object.entries(state.reports).map(([id, r]) => {
    const p = state.projects.find((x) => x.id === id);
    return [id, p ? { ...r, drafts: makeDrafts(p, next) } : r];
  }));
  set({ criteria: next, reports });
}
export function newCriterionId() {
  return `c${hash(String(Date.now() + Math.random()))}`;
}

/** Records the winners the judge picked and locks scores. The app never chooses. */
export async function finalize(winnerIds: string[]): Promise<void> {
  await wait(300);
  const names = winnerIds.map((id) => state.projects.find((p) => p.id === id)?.name ?? id);
  set({ finalized: true, winners: winnerIds });
  log("Finalized", "Draft", names.length ? `Final · winners: ${names.join(", ")}` : "Final");
}
export async function reopen(): Promise<void> {
  set({ finalized: false });
  log("Reopened for edits", "Final", "Draft");
}

export async function getChangeLog(): Promise<ChangeLogItem[]> {
  await wait(150);
  return state.log;
}

const DISCLAIMER = "AI scores are drafts; final scores are the judge's decisions.";

/** Builds an export file in the browser: rubric + judge's final scores + disclaimer. */
export function exportResults(format: ExportFormat): { filename: string; mime: string; content: string } {
  const s = state;
  const { ranked, waiting } = leaderboard(s);
  const rows = [...ranked, ...waiting].map((r, i) => ({
    rank: r.total === null ? null : i + 1,
    project: r.p.name,
    repo: r.p.repoUrl,
    winner: s.winners.includes(r.p.id),
    scores: Object.fromEntries(s.criteria.map((c) => [c.name, s.finals[r.p.id]?.[c.id] ?? null])),
    total: r.total === null ? null : Number(r.total.toFixed(2)),
  }));
  const status = s.finalized ? "Final" : "Draft, not final";
  if (format === "json")
    return { filename: "gavelmind-results.json", mime: "application/json", content: JSON.stringify({ note: DISCLAIMER, status, rubric: s.criteria.map(({ name, weight }) => ({ name, weight })), results: rows }, null, 2) };
  const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  if (format === "csv") {
    const head = ["Rank", "Project", "Repo", "Winner", ...s.criteria.map((c) => `${c.name} (${c.weight}%)`), "Judge total"];
    const body = rows.map((r) => [r.rank ?? "Awaiting judge review", r.project, r.repo, r.winner ? "yes" : "", ...s.criteria.map((c) => r.scores[c.name] ?? ""), r.total ?? ""].map(q).join(","));
    return { filename: "gavelmind-results.csv", mime: "text/csv", content: [q(DISCLAIMER), q(`Status: ${status}`), head.map(q).join(","), ...body].join("\n") };
  }
  const md = [
    "# GavelMind results", "", `> ${DISCLAIMER}`, "", `Status: ${status}`, "", "## Rubric", "",
    ...s.criteria.map((c) => `- ${c.name}: ${c.weight}%`), "", "## Judge's final scores", "",
    `| Rank | Project | ${s.criteria.map((c) => c.name).join(" | ")} | Total |`,
    `|---|---|${s.criteria.map(() => "---").join("|")}|---|`,
    ...rows.map((r) => `| ${r.rank ?? "Awaiting judge review"} | ${r.project}${r.winner ? " (winner)" : ""} | ${s.criteria.map((c) => r.scores[c.name] ?? "—").join(" | ")} | ${r.total ?? "—"} |`),
  ];
  return { filename: "gavelmind-results.md", mime: "text/markdown", content: md.join("\n") };
}
