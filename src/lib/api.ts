// All app data flows through here. Mock in-memory store for now; API_BASE_URL is reserved for a real backend.
import { useSyncExternalStore } from "react";

export const API_BASE_URL: string = import.meta.env["VITE_API_BASE_URL"] ?? "";

export type EntryStatus = "queued" | "analyzing" | "done" | "failed";
export type RunStatus = "worked" | "failed" | "error";
export type Tone = "serious" | "sarcastic" | "playful";

export interface Entry { id: string; url: string; name: string; status: EntryStatus }
export interface Criterion { id: string; name: string; weight: number }
export interface Draft { score: number; reason: string; evidence: string }
export type LogLineType = "cmd" | "ok" | "info" | "warn" | "error" | "result";
export interface LogLine { type: LogLineType; text: string }
export type CheckResult = "pass" | "fail" | "unknown";
export interface RuleCheck { id: string; label: string; result: CheckResult; evidence: string }
export interface Flag { text: string; severity: 1 | 2 | 3; evidence: string }
export type StackKind = "language" | "framework" | "database" | "tool";
export interface StackItem { name: string; kind: StackKind; desc: string }
export interface Report {
  entryId: string;
  summary: string[];
  run: { status: RunStatus; evidence: string; log: LogLine[] };
  flags: Flag[];
  checks: RuleCheck[];
  stack: StackItem[];
}
export interface LogItem { id: number; at: number; what: string; oldValue: string; newValue: string }

interface State {
  entries: Entry[];
  criteria: Criterion[];
  reports: Record<string, Report>;
  finals: Record<string, Record<string, number>>;
  log: LogItem[];
  finalized: boolean;
  tone: Tone;
}

const seedEntries: Entry[] = [
  { id: "e1", url: "https://github.com/lumen-labs/plantpal", name: "lumen-labs/plantpal", status: "done" },
  { id: "e2", url: "https://github.com/quietbyte/transit-whisper", name: "quietbyte/transit-whisper", status: "done" },
  { id: "e3", url: "https://github.com/ada-team/receipt-ninja", name: "ada-team/receipt-ninja", status: "done" },
];

function makeReport(e: Entry, n: number): Report {
  const runs: RunStatus[] = ["worked", "error", "worked", "failed"];
  const run = runs[n % runs.length] ?? "worked";
  return {
    entryId: e.id,
    summary: [
      `${e.name} is a hackathon project with a small web front end and a single service behind it.`,
      `The README describes the core idea clearly and lists setup steps that mostly match the code.`,
      `The main flow is implemented end to end, while secondary screens are partly stubbed.`,
      `Tests are light, covering only a few helper functions.`,
    ],
    run: {
      status: run,
      log: runLog(run),
      evidence:
        run === "worked"
          ? "`npm install && npm start` exited 0; server answered GET / with 200 in 412 ms."
          : run === "error"
            ? "Build succeeded, but runtime threw `TypeError: cannot read 'map' of undefined` at src/App.tsx:42."
            : "`npm install` failed: package-lock.json references a missing private package.",
    },
    flags:
      n % 2 === 0
        ? [
            { text: "87% of commits land in the last 2 hours before the deadline.", severity: 2, evidence: "41 of 47 commits between 22:04 and 23:58 on the final day (git log)." },
            { text: "README screenshots don't match the current UI.", severity: 1, evidence: "docs/screenshot.png shows a sidebar that no file in src/ renders." },
          ]
        : [{ text: "Large vendored folder copied from another open-source project.", severity: 3, evidence: "vendor/ (2.1 MB) matches an existing public repo file-for-file; licence not credited." }],
    checks: [
      { id: "week", label: "Built in hackathon week", result: n % 2 === 0 ? "pass" : "fail", evidence: n % 2 === 0 ? "First commit Mon 09:12, last commit Sun 23:58 — all inside the event window." : "First commit is 3 weeks before the event started." },
      { id: "sprite", label: "Runs on a Sprite", result: run === "worked" ? "pass" : run === "error" ? "unknown" : "fail", evidence: run === "worked" ? "Started in the sandbox and answered HTTP 200." : run === "error" ? "Built, but crashed before a request could be served." : "Install step failed; the app never started." },
      { id: "connector", label: "Uses a connector", result: n % 3 === 0 ? "pass" : "unknown", evidence: n % 3 === 0 ? "src/lib/calendar.ts calls a connected calendar service." : "No connector usage found in code; may be configured outside the repo." },
      { id: "demo", label: "Demo and description", result: "pass", evidence: "README has a description and a demo video link." },
    ],
    stack: [
      { name: "TypeScript", kind: "language", desc: "Used for the whole front end and the API handlers." },
      { name: "React", kind: "framework", desc: "Renders every screen of the app." },
      { name: n % 2 === 0 ? "SQLite" : "Postgres", kind: "database", desc: "Stores user records and saved items." },
      { name: "Vite", kind: "tool", desc: "Builds and serves the front end during development." },
    ],
  };
}

function runLog(run: RunStatus): LogLine[] {
  const base: LogLine[] = [
    { type: "info", text: "Cloning repository into isolated sandbox" },
    { type: "cmd", text: "npm install" },
  ];
  if (run === "failed")
    return [...base, { type: "error", text: "npm ERR! 404 package not found in registry" }, { type: "result", text: "Result: failed — install did not complete" }];
  const built: LogLine[] = [
    ...base,
    { type: "ok", text: "Dependencies installed" },
    { type: "warn", text: "2 deprecated packages" },
    { type: "cmd", text: "npm run build" },
    { type: "ok", text: "Build finished" },
    { type: "cmd", text: "npm start" },
  ];
  if (run === "error")
    return [...built, { type: "error", text: "TypeError: cannot read 'map' of undefined (src/App.tsx:42)" }, { type: "result", text: "Result: error — crashed at runtime" }];
  return [...built, { type: "ok", text: "GET / → 200 in 412 ms" }, { type: "result", text: "Result: worked" }];
}

/** Async read, same shape the real API will return. */
export function fetchReport(id: string): Promise<Report> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const r = state.reports[id];
      if (r) resolve(r);
      else reject(new Error("Report not found"));
    }, 350);
  });
}

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

export function draftFor(entryId: string, c: Criterion): Draft {
  const score = 4 + (hash(entryId + c.name) % 6); // 4..9 out of 10
  return {
    score,
    reason: score >= 7 ? `Strong on ${c.name.toLowerCase()}, with clear signs of intent.` : `${c.name} is present but uneven across the project.`,
    evidence: `See README.md and src/ (${(hash(c.id + entryId) % 30) + 3} relevant files reviewed).`,
  };
}

let state: State = {
  entries: seedEntries,
  criteria: [
    { id: "c1", name: "Creativity", weight: 25 },
    { id: "c2", name: "Usefulness", weight: 25 },
    { id: "c3", name: "Technical quality", weight: 25 },
    { id: "c4", name: "Demo clarity", weight: 25 },
  ],
  reports: Object.fromEntries(seedEntries.map((e, i) => [e.id, makeReport(e, i)])),
  finals: {},
  log: [],
  finalized: false,
  tone: "serious",
};

const listeners = new Set<() => void>();
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export function useApi() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

let logId = 0;
function log(what: string, oldValue: string, newValue: string) {
  set({ log: [{ id: ++logId, at: Date.now(), what, oldValue, newValue }, ...state.log] });
}

let idSeq = 100;
export function addEntries(text: string) {
  const urls = text.split(/[\s,]+/).map((u) => u.trim()).filter(Boolean);
  const fresh: Entry[] = urls.map((url) => ({
    id: `e${++idSeq}`,
    url,
    name: url.replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\/$/, ""),
    status: "queued",
  }));
  set({ entries: [...state.entries, ...fresh] });
}

export function analyze() {
  const todo = state.entries.filter((e) => e.status === "queued" || e.status === "failed");
  todo.forEach((e, i) => {
    updateEntry(e.id, "queued");
    setTimeout(() => updateEntry(e.id, "analyzing"), 400 + i * 500);
    setTimeout(() => {
      const ok = /^https?:\/\/(www\.)?github\.com\/[^/\s]+\/[^/\s]+\/?$/.test(e.url);
      if (ok) set({ reports: { ...state.reports, [e.id]: makeReport(e, hash(e.id)) } });
      updateEntry(e.id, ok ? "done" : "failed");
    }, 1800 + i * 700);
  });
}
function updateEntry(id: string, status: EntryStatus) {
  set({ entries: state.entries.map((e) => (e.id === id ? { ...e, status } : e)) });
}
export function removeEntry(id: string) {
  set({ entries: state.entries.filter((e) => e.id !== id) });
}

export function addCriterion(name: string) {
  set({ criteria: [...state.criteria, { id: `c${++idSeq}`, name, weight: 10 }] });
  log("Rubric: added criterion", "—", name);
}
export function removeCriterion(id: string) {
  const c = state.criteria.find((x) => x.id === id);
  set({ criteria: state.criteria.filter((x) => x.id !== id) });
  if (c) log("Rubric: removed criterion", c.name, "—");
}
export function renameCriterion(id: string, name: string) {
  const c = state.criteria.find((x) => x.id === id);
  if (!c || c.name === name || !name.trim()) return;
  set({ criteria: state.criteria.map((x) => (x.id === id ? { ...x, name } : x)) });
  log("Rubric: renamed criterion", c.name, name);
}
export function setWeight(id: string, weight: number) {
  const c = state.criteria.find((x) => x.id === id);
  if (!c || c.weight === weight) return;
  set({ criteria: state.criteria.map((x) => (x.id === id ? { ...x, weight } : x)) });
  log(`Rubric: weight of ${c.name}`, String(c.weight), String(weight));
}

export function setFinal(entryId: string, critId: string, value: number | null) {
  if (state.finalized) return;
  const prev = state.finals[entryId]?.[critId];
  if (prev === (value ?? undefined)) return;
  const row = { ...(state.finals[entryId] ?? {}) };
  if (value === null) delete row[critId];
  else row[critId] = value;
  set({ finals: { ...state.finals, [entryId]: row } });
  const e = state.entries.find((x) => x.id === entryId);
  const c = state.criteria.find((x) => x.id === critId);
  log(
    `Final score: ${e?.name ?? entryId} · ${c?.name ?? critId}`,
    prev === undefined ? "—" : String(prev),
    value === null ? "—" : String(value),
  );
}

export function setFinalized(v: boolean) {
  set({ finalized: v });
  log("Results status", v ? "Draft" : "Final", v ? "Final" : "Draft");
}
export function setTone(tone: Tone) {
  set({ tone });
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

/** Tone changes wording only, never numbers. */
export function voice(tone: Tone, key: "intro" | "flag" | "reason", text = ""): string {
  const t = {
    intro: { serious: "", sarcastic: "Brace yourself. ", playful: "Ooh, a fresh one! " },
    flag: { serious: "Worth checking", sarcastic: "Hmm, suspiciously convenient", playful: "Eyebrow-raiser" },
    reason: { serious: "", sarcastic: "To be fair: ", playful: "Fun fact: " },
  } as const;
  return t[key][tone] + text;
}
