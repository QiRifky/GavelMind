// All app data flows through here. Mock in-memory store for now; API_BASE_URL is reserved for a real backend.
import { useSyncExternalStore } from "react";

export const API_BASE_URL: string = import.meta.env["VITE_API_BASE_URL"] ?? "";

export type EntryStatus = "queued" | "analyzing" | "done" | "failed";
export type RunStatus = "worked" | "failed" | "error";
export type Tone = "serious" | "sarcastic" | "playful";

export interface Entry { id: string; url: string; name: string; status: EntryStatus }
export interface Criterion { id: string; name: string; weight: number }
export interface Draft { score: number; reason: string; evidence: string }
export interface Report {
  entryId: string;
  summary: string[];
  run: { status: RunStatus; evidence: string };
  flags: string[];
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
      evidence:
        run === "worked"
          ? "`npm install && npm start` exited 0; server answered GET / with 200 in 412 ms."
          : run === "error"
            ? "Build succeeded, but runtime threw `TypeError: cannot read 'map' of undefined` at src/App.tsx:42."
            : "`npm install` failed: package-lock.json references a missing private package.",
    },
    flags:
      n % 2 === 0
        ? ["87% of commits land in the last 2 hours before the deadline.", "README screenshots don't match the current UI."]
        : ["Large vendored folder (2.1 MB) copied from another open-source project."],
  };
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
