/**
 * GavelMind data layer. EVERY piece of app data goes through this file.
 * Workspace state is in memory; project analysis uses real GitHub evidence and Groq.
 * Reports never fall back to simulated material or scores.
 * Rule: AI only drafts. Ranking uses judge final scores only (see judgeTotal).
 */
import { useSyncExternalStore } from "react";
import { analyzeRepository } from "./analysis.functions";
import { storedDrafts } from "./analysis";
import { extractRulesFromUrl } from "./event-rules.functions";

export const API_BASE_URL: string = import.meta.env["VITE_API_BASE_URL"] ?? "";

// ---------- Types ----------
export type AnalysisStatus = "queued" | "analyzing" | "done" | "failed";
export type JudgeStatus = "Not reviewed" | "In review" | "Finalized";
export type RunStatus = "worked" | "failed" | "error" | "not run";
export type CheckResult = "pass" | "warn" | "fail";
export type SummaryStyle = "neutral" | "concise" | "detailed";
export type LogLineType = "cmd" | "ok" | "info" | "warn" | "error" | "result";

export interface Project { id: string; name: string; repoUrl: string; demoUrl?: string; status: AnalysisStatus }
export interface Criterion { id: string; name: string; weight: number }
export interface EventRule { id: string; label: string; enabled: boolean }
export interface EventContext { name: string; url: string; rules: EventRule[]; confirmed: boolean; /** AI-drafted description of the event page; informational only. */ summary?: string | undefined }
export interface LogLine { type: LogLineType; text: string }
export interface StackItem { name: string; kind: "language" | "framework" | "database" | "tool" }
export interface RuleCheck { id: string; label: string; result: CheckResult; reason: string; evidenceUrl: string }
/** One model's draft for one criterion. `model` is a display name supplied by the API. */
export interface ModelDraft { model: string; score: number; reason: string; evidence: string }
export interface Report {
  projectId: string;
  /** Exactly 3 neutral sentences. */
  summary: [string, string, string];
  does: string;
  doesNot: string;
  stack: StackItem[];
  checks: RuleCheck[];
  material: {
    description: { text: string; source: string };
    repository: { readme: string; source: string; run: { status: RunStatus; evidence: string; log: LogLine[] } };
    demo: { url?: string; transcriptStatus: "not provided" | "transcribing" | "ready"; transcript?: string; source: string };
  };
  /** Model names returned by the API, never hard-coded in components. */
  models: string[];
  drafts?: Record<string, ModelDraft[]>;
  draftCriteria?: Record<string, string>;
}
export interface JudgeScore { score?: number; note?: string }
export type ChangeKind = "score" | "note" | "rubric" | "finalized" | "event";
export interface ChangeItem { id: number; at: number; kind: ChangeKind; what: string; oldValue: string; newValue: string }
export interface Discovered { name: string; repoUrl: string; demoUrl?: string }
export type AnalyzeStage = 0 | 1 | 2 | 3;
export const STAGES = [
  { label: "Reading repository", detail: "Retrieving public GitHub repository material." },
  { label: "Reviewing source material", detail: "Inspecting README and a bounded source-code sample; no code execution." },
  { label: "Checking rules", detail: "Comparing commits, connectors and demo against the event rules." },
  { label: "Drafting scores", detail: "Writing draft scores with reasons for you to review." },
] as const;

interface State {
  event: EventContext | null;
  projects: Project[];
  criteria: Criterion[];
  reports: Record<string, Report>;
  judge: Record<string, Record<string, JudgeScore>>;
  log: ChangeItem[];
  finalized: boolean;
  winners: string[];
  /** Event folders; each keeps its own isolated workspace. */
  folders: EventFolder[];
  activeFolderId: string;
}
export interface EventFolder { id: string; name: string; createdAt: number }
type Workspace = Omit<State, "folders" | "activeFolderId">;

// ---------- Evidence-backed drafts ----------
const nameOf = (url: string) => url.replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\/$/, "");
export const isRepoUrl = (u: string) => /^https:\/\/(www\.)?github\.com\/[^/\s]+\/[^/\s]+\/?$/.test(u);
export function draftsFor(report: Report, c: Criterion): ModelDraft[] {
  return storedDrafts(report, c);
}
export const average = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0);
/** Models agree when every draft is within 1 point of every other. */
export const agreement = (xs: number[]) => xs.length > 0 && Math.max(...xs) - Math.min(...xs) <= 1;

// ---------- Store ----------
/** Criteria the judge can pick from in the rubric editor; "Custom name…" opens a text field. */
export const CRITERION_PRESETS: { name: string; hint: string }[] = [
  { name: "Creativity", hint: "Originality of the idea" },
  { name: "Usefulness", hint: "Practical impact for real users" },
  { name: "Technical quality", hint: "Architecture, code and reliability" },
  { name: "Demo clarity", hint: "How well the demo communicates the product" },
  { name: "UI/UX design", hint: "Interface quality and ease of use" },
  { name: "Innovation", hint: "Novelty of the approach" },
  { name: "Business viability", hint: "Market potential and sustainability" },
];
const DEFAULT_CRITERIA: Criterion[] = [
  { id: "c1", name: "Creativity", weight: 25 },
  { id: "c2", name: "Usefulness", weight: 25 },
  { id: "c3", name: "Technical quality", weight: 25 },
  { id: "c4", name: "Demo clarity", weight: 25 },
];
let state: State = {
  event: null,
  projects: [],
  criteria: DEFAULT_CRITERIA,
  reports: {},
  judge: {},
  log: [],
  finalized: false,
  winners: [],
  folders: [],
  activeFolderId: "",
};
const listeners = new Set<() => void>();
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};
/** Live view of the store for components. */
export function useApi() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}
/** Read-only snapshot for tests; never mutate. */
export function snapshot(): State {
  return state;
}
const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((res, rej) => {
    const t = setTimeout(res, ms);
    signal?.addEventListener("abort", () => { clearTimeout(t); rej(new DOMException("Cancelled", "AbortError")); });
  });
let logId = 0;
function log(kind: ChangeKind, what: string, oldValue: string, newValue: string) {
  set({ log: [{ id: ++logId, at: Date.now(), kind, what, oldValue, newValue }, ...state.log] });
}
let idSeq = 100;

// ---------- Event folders: switching swaps the whole workspace so events never mix ----------
const stored = new Map<string, Workspace>();
const workspaceOf = (s: State): Workspace => { const { folders: _f, activeFolderId: _a, ...w } = s; return w; };
export const folderName = (f: EventFolder, s: State = state) => (f.id === s.activeFolderId ? s.event?.name : stored.get(f.id)?.event?.name) || f.name;
export function folderStats(id: string, s: State = state) {
  const w = id === s.activeFolderId ? s : stored.get(id);
  const projects = w?.projects ?? [];
  return { projects: projects.length, ready: projects.filter((p) => p.status === "done").length, confirmed: Boolean(w?.event?.confirmed), finalized: Boolean(w?.finalized) };
}
export function switchFolder(id: string): void {
  if (id === state.activeFolderId || !state.folders.some((f) => f.id === id)) return;
  if (state.activeFolderId) stored.set(state.activeFolderId, workspaceOf(state));
  const next = stored.get(id);
  if (!next) return;
  stored.delete(id);
  set({ ...next, activeFolderId: id });
}
export function createFolder(name: string): string {
  const clean = name.trim() || `Event ${state.folders.length + 1}`;
  const id = `f${++idSeq}`;
  stored.set(id, { event: null, projects: [], criteria: DEFAULT_CRITERIA, reports: {}, judge: {}, log: [], finalized: false, winners: [] });
  set({ folders: [...state.folders, { id, name: clean, createdAt: Date.now() }] });
  switchFolder(id);
  return id;
}
export function deleteFolder(id: string): void {
  if (state.folders.length <= 1) return;
  const rest = state.folders.filter((f) => f.id !== id);
  if (id === state.activeFolderId) { const target = rest[0]; if (target) switchFolder(target.id); }
  stored.delete(id);
  set({ folders: state.folders.filter((f) => f.id !== id) });
}

// ---------- Event (rules can be drafted from the public event page; judge confirms) ----------
export function saveEvent(name: string, url: string): void {
  let parsed: URL;
  try { parsed = new URL(url.trim()); } catch { throw new Error("Enter a valid event URL."); }
  if (!["https:", "http:"].includes(parsed.protocol) || !name.trim()) throw new Error("Enter an event name and a valid web URL.");
  log("event", "Event context", state.event?.name ?? "—", name.trim());
  set({ event: { name: name.trim(), url: url.trim(), rules: [], confirmed: false } });
}
export async function extractEventRules(): Promise<void> {
  const event = state.event;
  if (!event) throw new Error("Save an event first.");
  const result = await extractRulesFromUrl({ data: { url: event.url } });
  if (!result.ok) throw new Error(result.message);
  const current = state.event;
  if (!current || current.url !== event.url) return;
  // Drafted from the event page; the judge must still review and confirm.
  set({ event: { ...current, summary: result.summary || current.summary, rules: result.rules.map((r) => ({ id: newEventRuleId(), label: r.label, enabled: true })), confirmed: false } });
  log("event", `${event.name} · rules drafted from event page`, "—", `${result.rules.length} rules`);
}
export function updateEventRules(rules: EventRule[]): void {
  if (!state.event) return;
  set({ event: { ...state.event, rules: rules.map((r) => ({ ...r })), confirmed: false } });
}
export function confirmEventRules(): boolean {
  const event = state.event;
  if (!event || !event.rules.some((r) => r.enabled) || event.rules.some((r) => r.enabled && !r.label.trim())) return false;
  log("event", `${event.name} · rules confirmed`, "Draft", event.rules.filter((r) => r.enabled).map((r) => r.label).join("; "));
  set({ event: { ...event, confirmed: true } });
  return true;
}
export const newEventRuleId = () => `event-rule-${++idSeq}`;
/** Confirmed rules replace legacy sample event claims. No evidence means warning, not failure. */
export function reportForEvent(report: Report, event: EventContext | null): Report {
  if (!event) return report;
  const checks: RuleCheck[] = event.confirmed ? event.rules.filter((r) => r.enabled).map((r) => ({
    id: r.id, label: r.label, result: "warn", reason: "Not verified — repository inspection alone cannot establish this requirement. Judge review required.", evidenceUrl: event.url,
  })) : [];
  return { ...report, checks: [...checks, ...report.checks.filter((c) => c.id === "runs")] };
}
export function eventRubricSuggestions(): Criterion[] {
  return DEFAULT_CRITERIA.map((c) => ({ ...c }));
}

// ---------- Projects ----------
export async function listProjects(): Promise<Project[]> {
  await wait(200);
  return state.projects;
}
/** Adds URLs (one per line). Skips duplicates. Returns the created projects. */
export function addProjects(items: Array<string | Discovered>): Project[] {
  const known = new Set(state.projects.map((p) => p.repoUrl));
  const fresh: Project[] = [];
  for (const it of items) {
    const d: Discovered = typeof it === "string" ? { repoUrl: it.trim(), name: nameOf(it.trim()) } : it;
    if (!d.repoUrl || known.has(d.repoUrl)) continue;
    known.add(d.repoUrl);
    fresh.push({ id: `p${++idSeq}`, name: d.name, repoUrl: d.repoUrl, status: "queued", ...(d.demoUrl ? { demoUrl: d.demoUrl } : {}) });
  }
  set({ projects: [...state.projects, ...fresh] });
  return fresh;
}
export const splitUrls = (text: string) => text.split(/[\s,]+/).map((u) => u.trim()).filter(Boolean);
export function removeProject(id: string) {
  set({ projects: state.projects.filter((p) => p.id !== id) });
}
/** Reads a showcase page and returns the projects it lists (mock). */
export async function scanShowcase(pageUrl: string): Promise<Discovered[]> {
  if (!/^https?:\/\//.test(pageUrl)) throw new Error("That doesn't look like a web address.");
  throw new Error("Showcase import is not connected. Add actual GitHub URLs using single analysis or bulk URLs; no sample entries were added.");
}
function setStatus(id: string, status: AnalysisStatus) {
  set({ projects: state.projects.map((p) => (p.id === id ? { ...p, status } : p)) });
}
type AnalysisOptions = { onStage?: (s: AnalyzeStage) => void; signal?: AbortSignal; stageMs?: number };
const analysisPreviews = new Map<string, { folderId: string; project: Project; report: Report }>();
async function prepareReport(project: Project, opts: AnalysisOptions): Promise<Report> {
  const abort = () => { if (opts.signal?.aborted) throw new DOMException("Cancelled", "AbortError"); };
  abort();
  if (!isRepoUrl(project.repoUrl)) throw new Error("Use a public HTTPS GitHub repository URL.");
  opts.onStage?.(0);
  const criteria = state.criteria.map((c) => ({ ...c }));
  opts.onStage?.(1);
  opts.onStage?.(3);
  const result = await analyzeRepository({ data: { project: { id: project.id, repoUrl: project.repoUrl }, criteria }, ...(opts.signal ? { signal: opts.signal } : {}) });
  abort();
  if (!result.ok) throw new Error(result.message);
  return result.report;
}
/** Single analysis stays outside the queue until explicitly accepted. */
export async function analyzePreview(repoUrl: string, opts: AnalysisOptions = {}) {
  const folderId = state.activeFolderId;
  const url = repoUrl.trim();
  const existing = state.projects.find((p) => p.repoUrl === url);
  const project: Project = existing ?? { id: `p${++idSeq}`, name: nameOf(url), repoUrl: url, status: "done" };
  const report = await prepareReport(project, opts);
  analysisPreviews.set(project.id, { folderId, project, report });
  return { project, report };
}
export function enqueuePreview(id: string): Project {
  const preview = analysisPreviews.get(id);
  if (!preview || preview.folderId !== state.activeFolderId) throw new Error("Analyze this project again in the current event.");
  const existing = state.projects.find((p) => p.repoUrl === preview.project.repoUrl);
  const project: Project = { ...(existing ?? preview.project), status: "done" };
  // Keep an existing ready report intact, including its draft identity.
  const report = state.reports[project.id] ?? { ...preview.report, projectId: project.id };
  set({ projects: existing ? state.projects.map((p) => p.id === project.id ? project : p) : [...state.projects, project], reports: { ...state.reports, [project.id]: report } });
  return project;
}
/** Prepare missing material for selected entries, then open the first selected project. */
export async function prepareJudging(ids: string[], opts: AnalysisOptions = {}): Promise<string> {
  const folderId = state.activeFolderId;
  const selected = state.projects.filter((p) => ids.includes(p.id));
  const first = selected[0];
  if (!first) throw new Error("Select a project first.");
  for (const project of selected) {
    if (project.status !== "done" || !state.reports[project.id]) await analyzeProject(project.id, opts);
    if (state.activeFolderId !== folderId) throw new Error("The active event changed. Select projects again.");
  }
  return first.id;
}
/**
 * Runs the four analysis stages. onStage reports progress; abort the signal to cancel
 * (the project goes back to queued). Rejects for URLs that are not a GitHub repo.
 */
export async function analyzeProject(id: string, opts: AnalysisOptions = {}): Promise<Report> {
  const p = state.projects.find((x) => x.id === id);
  if (!p) throw new Error("Project not found");
  const folderId = state.activeFolderId;
  setStatus(id, "analyzing");
  let report: Report;
  try {
    report = await prepareReport(p, opts);
  } catch (e) {
    if (state.activeFolderId === folderId) setStatus(id, e instanceof DOMException && e.name === "AbortError" ? "queued" : "failed");
    throw e;
  }
  if (state.activeFolderId !== folderId) throw new Error("The active event changed. Analyze this project again.");
  set({ reports: { ...state.reports, [id]: report } });
  setStatus(id, "done");
  return report;
}
export async function getReport(id: string): Promise<Report> {
  await wait(350);
  const r = state.reports[id];
  if (!r) throw new Error("No report yet. Run the analysis first.");
  return r;
}

// ---------- Judge ----------
/** Autosaves one judge field. score null clears it. Logged. */
export function saveJudgeScore(projectId: string, critId: string, patch: { score?: number | null; note?: string }) {
  if (state.finalized) return;
  const prev = state.judge[projectId]?.[critId] ?? {};
  const next: JudgeScore = { ...prev };
  const p = state.projects.find((x) => x.id === projectId)?.name ?? projectId;
  const c = state.criteria.find((x) => x.id === critId)?.name ?? critId;
  if (patch.score !== undefined && patch.score !== (prev.score ?? null)) {
    if (patch.score === null) delete next.score;
    else next.score = Math.max(0, Math.min(10, patch.score));
    log("score", `${p} · ${c}`, prev.score === undefined ? "—" : String(prev.score), next.score === undefined ? "—" : String(next.score));
  }
  if (patch.note !== undefined && patch.note !== (prev.note ?? "")) {
    if (patch.note === "") delete next.note;
    else next.note = patch.note;
    log("note", `${p} · ${c} note`, prev.note ?? "—", patch.note || "—");
  }
  set({ judge: { ...state.judge, [projectId]: { ...(state.judge[projectId] ?? {}), [critId]: next } } });
}
export function finalsOf(projectId: string, s: State = state): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(s.judge[projectId] ?? {})) if (v.score !== undefined) out[k] = v.score;
  return out;
}
export function judgeStatus(projectId: string, s: State = state): JudgeStatus {
  const n = Object.keys(finalsOf(projectId, s)).length;
  if (s.finalized && judgeTotal(finalsOf(projectId, s), s.criteria) !== null) return "Finalized";
  return n > 0 ? "In review" : "Not reviewed";
}
/** Weighted score from the judge's final numbers only; null until every criterion is decided. */
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

// ---------- Rubric ----------
export async function getRubric(): Promise<Criterion[]> {
  await wait(150);
  return state.criteria;
}
export const weightTotal = (cs: Criterion[]) => cs.reduce((a, c) => a + c.weight, 0);
/** Save is allowed only when weights total exactly 100 and every name is filled. */
export const canSaveRubric = (cs: Criterion[]) => cs.length > 0 && weightTotal(cs) === 100 && cs.every((c) => c.name.trim() !== "");
export function saveRubric(next: Criterion[]): boolean {
  if (!canSaveRubric(next)) return false;
  const old = state.criteria;
  for (const c of next) {
    const o = old.find((x) => x.id === c.id);
    if (!o) log("rubric", "Rubric: added criterion", "—", `${c.name} (${c.weight}%)`);
    else {
      if (o.name !== c.name) log("rubric", "Rubric: renamed criterion", o.name, c.name);
      if (o.weight !== c.weight) log("rubric", `Rubric: weight of ${c.name}`, `${o.weight}%`, `${c.weight}%`);
    }
  }
  for (const o of old) if (!next.some((c) => c.id === o.id)) log("rubric", "Rubric: removed criterion", o.name, "—");
  set({ criteria: next.map((c) => ({ ...c, name: c.name.trim() })) });
  return true;
}
export const newCriterionId = () => `c${++idSeq}`;

// ---------- Results ----------
/** Records the winners the judge picked. The app never picks them. */
export function finalize(winnerIds: string[]) {
  set({ finalized: true, winners: winnerIds });
  const names = winnerIds.map((id) => state.projects.find((p) => p.id === id)?.name ?? id).join(", ");
  log("finalized", "Results finalized", "Draft", names ? `Final · winners: ${names}` : "Final");
}
export function reopen() {
  set({ finalized: false, winners: [] });
  log("finalized", "Results reopened", "Final", "Draft");
}
export function getChangeLog(): ChangeItem[] {
  return state.log;
}
export const EXPORT_LINE = "AI scores are drafts; final scores are the judge's decisions.";
export type ExportFormat = "csv" | "json" | "md";
/** Builds the export file in the browser. */
export function exportResults(format: ExportFormat, s: State = state): { filename: string; mime: string; content: string } {
  const rows = s.projects.map((p) => ({ name: p.name, repo: p.repoUrl, scores: finalsOf(p.id, s), total: judgeTotal(finalsOf(p.id, s), s.criteria) }));
  const fmt = (t: number | null) => (t === null ? "Awaiting judge review" : t.toFixed(2));
  if (format === "json")
    return { filename: "gavelmind-results.json", mime: "application/json", content: JSON.stringify({ note: EXPORT_LINE, finalized: s.finalized, rubric: s.criteria, winners: s.winners, results: rows }, null, 2) };
  if (format === "csv") {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const head = ["Project", "Repo", ...s.criteria.map((c) => `${c.name} (${c.weight}%)`), "Judge total"];
    const body = rows.map((r) => [r.name, r.repo, ...s.criteria.map((c) => String(r.scores[c.id] ?? "")), fmt(r.total)].map(esc).join(","));
    return { filename: "gavelmind-results.csv", mime: "text/csv", content: [esc(EXPORT_LINE), head.map(esc).join(","), ...body].join("\n") };
  }
  const md = [
    "# GavelMind results", "", `> ${EXPORT_LINE}`, "", `Status: ${s.finalized ? "Final" : "Draft, not final"}`, "",
    "## Rubric", ...s.criteria.map((c) => `- ${c.name}: ${c.weight}%`), "",
    "## Judge's final scores", `| Project | ${s.criteria.map((c) => c.name).join(" | ")} | Total |`, `|---|${s.criteria.map(() => "---").join("|")}|---|`,
    ...rows.map((r) => `| ${r.name} | ${s.criteria.map((c) => r.scores[c.id] ?? "—").join(" | ")} | ${fmt(r.total)} |`),
  ];
  return { filename: "gavelmind-results.md", mime: "text/markdown", content: md.join("\n") };
}

/** Summary wording per style. Style changes wording only, never numbers. */
export function summaryText(r: Report, style: SummaryStyle): string[] {
  if (style === "concise") return [r.summary[0]];
  if (style === "detailed") return [...r.summary, `What it does: ${r.does}`, `What it does not do: ${r.doesNot}`];
  return [...r.summary];
}
