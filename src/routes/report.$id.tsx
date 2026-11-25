import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  draftFor, fetchReport, judgeTotal, setFinal, setFinalized, setTone, useApi, voice,
  type CheckResult, type Criterion, type LogLineType, type Report, type StackKind, type Tone,
} from "@/lib/api";
import { ACCENTS, CardState, CardTitle, GlowCard } from "@/components/glow-card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/report/$id")({
  head: () => ({
    meta: [
      { title: "Report card — GavelMind" },
      { name: "description", content: "AI-prepared report with draft scores for the judge to decide." },
      { property: "og:title", content: "Report card — GavelMind" },
      { property: "og:description", content: "AI-prepared report with draft scores for the judge to decide." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportPage,
});

type Load = { state: "loading" } | { state: "error"; message: string } | { state: "ready"; report: Report };

function ReportPage() {
  const { id } = Route.useParams();
  const { entries, criteria, finals, finalized, tone } = useApi();
  const entry = entries.find((e) => e.id === id);
  const [load, setLoad] = useState<Load>({ state: "loading" });

  useEffect(() => {
    let live = true;
    setLoad({ state: "loading" });
    fetchReport(id).then(
      (report) => live && setLoad({ state: "ready", report }),
      (e: unknown) => live && setLoad({ state: "error", message: e instanceof Error ? e.message : "Could not load report" }),
    );
    return () => { live = false; };
  }, [id]);

  const report = load.state === "ready" ? load.report : null;
  const mine = finals[id] ?? {};
  const allScored = criteria.length > 0 && criteria.every((c) => mine[c.id] !== undefined);

  return (
    <div className="text-slate-200">
      <div aria-hidden className="fixed inset-0 -z-10 bg-night" />
      <header className="mb-6">
        <p className="text-xs font-medium tracking-[0.16em] text-indigo-300">REPORT CARD</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h2 className="min-w-0 truncate text-[clamp(1.8rem,1rem+2.4vw,2.8rem)] font-normal tracking-[-0.03em] text-slate-50">{entry?.name ?? "Unknown project"}</h2>
          <span className={cn("rounded-full px-3 py-1 text-xs font-medium",
            finalized ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-300")}>
            {finalized ? "Final" : "AI draft - awaiting judge review"}
          </span>
        </div>
        {entry && <a href={entry.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-slate-400 hover:text-slate-200">{entry.url}</a>}
        <p role="note" className="mt-4 rounded-2xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
          AI scores are suggestions to help you decide. The final decision is yours.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <GlowCard accent="indigo" label="Judge's decision" className="md:col-span-2 lg:row-span-2">
          <JudgeCard load={load} id={id} criteria={criteria} mine={mine} finalized={finalized} tone={tone} allScored={allScored} />
        </GlowCard>
        <GlowCard accent="fuchsia" label="Sandbox run log" className="lg:row-span-2">
          <RunLog load={load} />
        </GlowCard>
        <GlowCard accent="emerald" label="Rule checks">
          <CardTitle accent="emerald">Rule checks</CardTitle>
          {load.state === "loading" ? <CardState kind="loading" /> : load.state === "error" ? <CardState kind="error">{load.message}</CardState>
            : load.report.checks.length === 0 ? <CardState kind="empty">No rule checks available.</CardState> : <RuleChecks report={load.report} />}
        </GlowCard>
        <GlowCard accent="amber" label="Flags">
          <Flags load={load} tone={tone} />
        </GlowCard>
        <GlowCard accent="amber" label="Detected stack" className="md:col-span-2 lg:col-span-4">
          <Stack load={load} />
        </GlowCard>
      </div>

      <div className="mt-4">
        <GlowCard accent="cyan" label="Summary">
          <CardTitle accent="cyan" right={<ToneSelect tone={tone} />}>Summary</CardTitle>
          {load.state === "loading" ? <CardState kind="loading" /> : load.state === "error" ? <CardState kind="error">{load.message}</CardState>
            : report && report.summary.length > 0 ? <p className="max-w-3xl leading-relaxed text-slate-300">{voice(tone, "intro")}{report.summary.join(" ")}</p>
            : <CardState kind="empty">No summary yet.</CardState>}
        </GlowCard>
      </div>
    </div>
  );
}

function ToneSelect({ tone }: { tone: Tone }) {
  return (
    <label className="flex items-center gap-2 text-xs text-slate-400">
      Tone
      <select value={tone} onChange={(e) => setTone(e.target.value as Tone)} className="h-8 rounded-full border border-white/15 bg-night px-3 text-slate-200 focus-visible:outline-2 focus-visible:outline-cyan-300">
        <option value="serious">Serious</option>
        <option value="sarcastic">Sarcastic but fair</option>
        <option value="playful">Playful</option>
      </select>
    </label>
  );
}

/* ---------------- Judge's decision ---------------- */

function JudgeCard({ load, id, criteria, mine, finalized, tone, allScored }: {
  load: Load; id: string; criteria: Criterion[]; mine: Record<string, number>; finalized: boolean; tone: Tone; allScored: boolean;
}) {
  const total = judgeTotal(mine, criteria);
  const drafts = criteria.map((c) => draftFor(id, c));
  const wsum = criteria.reduce((s, c) => s + c.weight, 0);
  const aiTotal = wsum ? drafts.reduce((s, d, i) => s + d.score * (criteria[i]?.weight ?? 0), 0) / wsum : null;
  return (
    <>
      <CardTitle accent="indigo">Judge's decision</CardTitle>
      {load.state === "loading" ? <CardState kind="loading" /> : load.state === "error" ? <CardState kind="error">{load.message}</CardState>
        : criteria.length === 0 ? <CardState kind="empty">No rubric criteria. Add some on the <Link to="/rubric" className="underline">Rubric</Link> page.</CardState> : (
        <>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p className="text-4xl font-normal tabular-nums tracking-tight text-slate-50 sm:text-5xl">
              {total === null ? "Awaiting review" : total.toFixed(2)}
            </p>
            {aiTotal !== null && <p className="text-sm tabular-nums text-slate-400">AI draft: {aiTotal.toFixed(1)}</p>}
          </div>
          <Chart criteria={criteria} drafts={drafts.map((d) => d.score)} finals={criteria.map((c) => mine[c.id])} />
          <ul className="mt-4 divide-y divide-white/10">
            {criteria.map((c, i) => {
              const d = drafts[i];
              if (!d) return null;
              const v = mine[c.id];
              return (
                <li key={c.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-100">{c.name} <span className="text-xs font-normal text-slate-500">· AI draft {d.score}</span></p>
                    <p className="mt-0.5 text-sm text-slate-400">{voice(tone, "reason", d.reason)}</p>
                    <details className="mt-1 text-xs text-slate-400">
                      <summary className="cursor-pointer text-indigo-300 focus-visible:outline-2 focus-visible:outline-indigo-300">Evidence</summary>
                      <p className="mt-1">{d.evidence}</p>
                    </details>
                  </div>
                  <label className="flex flex-col items-center rounded-2xl border border-indigo-300/30 bg-night px-3 py-1.5">
                    <span className="text-[0.62rem] uppercase tracking-wider text-indigo-200">Judge's decision</span>
                    <input type="number" min={0} max={10} step={0.5} disabled={finalized} value={v ?? ""} placeholder="—"
                      onChange={(e) => setFinal(id, c.id, e.target.value === "" ? null : Math.min(10, Math.max(0, Number(e.target.value))))}
                      className="w-14 bg-transparent text-center text-lg tabular-nums text-slate-50 focus:outline-hidden disabled:opacity-60" />
                  </label>
                </li>
              );
            })}
          </ul>
          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            {finalized ? (
              <button onClick={() => setFinalized(false)} className="h-10 rounded-full border border-white/20 px-5 text-sm hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-indigo-300">Reopen for edits</button>
            ) : (
              <button disabled={!allScored} onClick={() => setFinalized(true)} title={allScored ? "" : "Score every criterion first"}
                className="h-10 rounded-full bg-indigo-400 px-5 text-sm font-medium text-night transition active:scale-[0.97] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300">Finalize</button>
            )}
            <Link to="/changelog" className="inline-flex h-10 items-center rounded-full border border-white/20 px-5 text-sm hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-indigo-300">View change log</Link>
          </div>
        </>
      )}
    </>
  );
}

function Chart({ criteria, drafts, finals }: { criteria: Criterion[]; drafts: number[]; finals: (number | undefined)[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 400, H = 150, P = 18;
  const n = criteria.length;
  const x = (i: number) => (n === 1 ? W / 2 : P + (i * (W - 2 * P)) / (n - 1));
  const y = (v: number) => H - P - (v / 10) * (H - 2 * P);
  const path = (vals: (number | undefined)[]) =>
    vals.map((v, i) => (v === undefined ? null : `${x(i)},${y(v)}`)).filter(Boolean).join(" ");
  const pick = (clientX: number, el: SVGSVGElement) => {
    const r = el.getBoundingClientRect();
    const px = ((clientX - r.left) / r.width) * W;
    let best = 0;
    for (let i = 1; i < n; i++) if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    setHover(best);
  };
  const hc = hover !== null ? criteria[hover] : undefined;
  const indigo = ACCENTS.indigo;
  return (
    <div className="relative mt-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-none rounded-2xl bg-night/60 focus-visible:outline-2 focus-visible:outline-indigo-300"
        role="img" aria-label="AI draft versus judge's final score per criterion" tabIndex={0}
        onPointerMove={(e) => pick(e.clientX, e.currentTarget)} onPointerLeave={() => setHover(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setHover((h) => Math.min(n - 1, (h ?? -1) + 1));
          if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? n) - 1));
        }}
        onBlur={() => setHover(null)}>
        {[0, 5, 10].map((v) => <line key={v} x1={P} x2={W - P} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.06)" />)}
        <polyline points={path(drafts)} fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth={1.5} strokeDasharray="4 4" />
        <polyline points={path(finals)} fill="none" stroke={`rgb(${indigo})`} strokeWidth={2.5} style={{ filter: `drop-shadow(0 0 6px rgba(${indigo},0.8))` }} />
        {finals.map((v, i) => v !== undefined && <circle key={i} cx={x(i)} cy={y(v)} r={3.5} fill={`rgb(${indigo})`} />)}
        {drafts.map((v, i) => <circle key={`d${i}`} cx={x(i)} cy={y(v)} r={2.5} fill="rgba(148,163,184,0.8)" />)}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={P / 2} y2={H - P / 2} stroke="rgba(255,255,255,0.35)" />}
      </svg>
      <div className="mt-2 flex gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5"><span className="w-4 border-t border-dashed border-slate-400" />AI draft</span>
        <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-indigo-400" />Judge's final</span>
      </div>
      <p aria-live="polite" className={cn("pointer-events-none absolute left-2 top-2 rounded-xl border border-white/10 bg-night px-3 py-2 text-xs transition-opacity", hc ? "opacity-100" : "opacity-0")}>
        {hc && hover !== null && <>
          <span className="block font-medium text-slate-100">{hc.name}</span>
          AI draft {drafts[hover]} · Judge {finals[hover] ?? "—"}
        </>}
      </p>
    </div>
  );
}

/* ---------------- Run log ---------------- */

const lineStyle: Record<LogLineType, { mark: string; cls: string }> = {
  cmd: { mark: "$", cls: "text-slate-100" },
  ok: { mark: "✓", cls: "text-emerald-300" },
  info: { mark: "·", cls: "text-slate-400" },
  warn: { mark: "!", cls: "text-amber-300" },
  error: { mark: "✗", cls: "text-red-400" },
  result: { mark: "→", cls: "font-medium text-fuchsia-200" },
};

function RunLog({ load }: { load: Load }) {
  const lines = load.state === "ready" ? load.report.run.log : [];
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (load.state !== "ready") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(lines.length); return; }
    setShown(0);
    let i = 0;
    const t = setInterval(() => { i++; setShown(i); if (i >= lines.length) clearInterval(t); }, 260);
    return () => clearInterval(t);
  }, [load.state, lines.length]);
  const status = load.state === "ready" ? load.report.run.status : null;
  return (
    <>
      <CardTitle accent="fuchsia" right={status && (
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs", status === "worked" ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300")}>{status}</span>
      )}>Sandbox run log</CardTitle>
      {load.state === "loading" ? <CardState kind="loading" /> : load.state === "error" ? <CardState kind="error">{load.message}</CardState>
        : lines.length === 0 ? <CardState kind="empty">No run log recorded.</CardState> : (
        <div role="log" aria-label="Sandbox run output" className="flex-1 overflow-auto rounded-2xl bg-night p-4 font-mono text-xs leading-6">
          {lines.slice(0, shown).map((l, i) => (
            <div key={i} className={cn("grid grid-cols-[1rem_minmax(0,1fr)] gap-2", lineStyle[l.type].cls)}>
              <span aria-hidden>{lineStyle[l.type].mark}</span><span className="break-words">{l.text}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------------- Rule checks ---------------- */

const ring: Record<CheckResult, { stroke: string; full: boolean; word: string }> = {
  pass: { stroke: "rgb(52,211,153)", full: true, word: "Pass" },
  fail: { stroke: "rgb(248,113,113)", full: true, word: "Fail" },
  unknown: { stroke: "rgba(148,163,184,0.35)", full: false, word: "Unknown" },
};

function RuleChecks({ report }: { report: Report }) {
  const [tip, setTip] = useState<string | null>(null);
  return (
    <>
      <ul className="grid grid-cols-4 gap-2">
        {report.checks.map((c) => {
          const r = ring[c.result];
          return (
            <li key={c.id}>
              <button type="button" onMouseEnter={() => setTip(c.evidence)} onMouseLeave={() => setTip(null)} onFocus={() => setTip(c.evidence)} onBlur={() => setTip(null)}
                aria-label={`${c.label}: ${r.word}. ${c.evidence}`}
                className="flex w-full flex-col items-center gap-1.5 rounded-xl p-1 focus-visible:outline-2 focus-visible:outline-emerald-300">
                <svg viewBox="0 0 36 36" className="size-10" aria-hidden>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                  {r.full && <circle cx="18" cy="18" r="14" fill="none" stroke={r.stroke} strokeWidth="4" />}
                </svg>
                <span className="text-center text-[0.65rem] leading-tight text-slate-400">{c.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p aria-live="polite" className="mt-3 min-h-8 text-xs text-slate-400">{tip ?? "Hover or tab to a check to see the evidence."}</p>
    </>
  );
}

/* ---------------- Flags ---------------- */

function Flags({ load, tone }: { load: Load; tone: Tone }) {
  const flags = load.state === "ready" ? load.report.flags : [];
  return (
    <>
      <CardTitle accent="amber">Flags</CardTitle>
      {load.state === "loading" ? <CardState kind="loading" /> : load.state === "error" ? <CardState kind="error">{load.message}</CardState>
        : flags.length === 0 ? <CardState kind="empty">No flags found</CardState> : (
        <>
          <p className="text-4xl tabular-nums text-amber-200">{flags.length}</p>
          <p className="text-xs text-slate-500">{voice(tone, "flag")}</p>
          <ul className="mt-3 space-y-2">
            {flags.map((f) => (
              <li key={f.text}>
                <details className="group/f rounded-xl bg-night/70 p-2.5 text-xs">
                  <summary className="flex cursor-pointer list-none gap-2 text-slate-300 focus-visible:outline-2 focus-visible:outline-amber-300">
                    <span className="mt-0.5 flex shrink-0 gap-0.5" aria-label={`Severity ${f.severity} of 3`}>
                      {[1, 2, 3].map((s) => <span key={s} className={cn("h-3 w-1 rounded-full", s <= f.severity ? "bg-amber-300" : "bg-white/10")} />)}
                    </span>
                    {f.text}
                  </summary>
                  <p className="mt-2 text-slate-400">{f.evidence}</p>
                </details>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

/* ---------------- Stack ---------------- */

const icons: Record<StackKind, ReactNode> = {
  language: <path d="M8 7 3 12l5 5M16 7l5 5-5 5" />,
  framework: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="16" height="7" rx="1.5" /></>,
  database: <><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v12c0 1.7 3 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3 3 7 3s7-1.3 7-3" /></>,
  tool: <path d="M14 6a4 4 0 0 0 5 5l-8 8a2 2 0 0 1-3-3l8-8a4 4 0 0 0-2-2Z" />,
};

function Stack({ load }: { load: Load }) {
  const [desc, setDesc] = useState<string | null>(null);
  const items = load.state === "ready" ? load.report.stack : [];
  return (
    <>
      <CardTitle accent="amber">Detected stack</CardTitle>
      {load.state === "loading" ? <CardState kind="loading" /> : load.state === "error" ? <CardState kind="error">{load.message}</CardState>
        : items.length === 0 ? <CardState kind="empty">No languages or tools detected.</CardState> : (
        <>
          <ul className="flex flex-wrap gap-2">
            {items.map((t) => (
              <li key={t.name}>
                <button type="button" onMouseEnter={() => setDesc(`${t.name}: ${t.desc}`)} onMouseLeave={() => setDesc(null)}
                  onFocus={() => setDesc(`${t.name}: ${t.desc}`)} onBlur={() => setDesc(null)}
                  className="flex items-center gap-2 rounded-full border border-white/15 bg-night/70 px-3 py-1.5 text-sm text-slate-200 hover:border-amber-300/60 focus-visible:outline-2 focus-visible:outline-amber-300">
                  <svg viewBox="0 0 24 24" className="size-4 text-amber-300" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{icons[t.kind]}</svg>
                  {t.name}
                </button>
              </li>
            ))}
          </ul>
          <p aria-live="polite" className="mt-3 text-sm text-slate-400">{desc ?? "Hover or tab to a tool to see what it does in this project."}</p>
        </>
      )}
    </>
  );
}
