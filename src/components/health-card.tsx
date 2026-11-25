import { agreement, average, draftsFor, type Criterion, type Report } from "@/lib/api";
import { CardTitle, GlowCard } from "@/components/glow-card";

/** Project health summary. Shows prepared facts and AI averages only; never a rank or winner. */
export function HealthCard({ r, criteria, finals }: { r: Report; criteria: Criterion[]; finals: Record<string, number> }) {
  const pass = r.checks.filter((c) => c.result === "pass").length;
  const warn = r.checks.filter((c) => c.result === "warn").length;
  const fail = r.checks.filter((c) => c.result === "fail").length;
  const perCrit = criteria.map((c) => draftsFor(r, c).map((d) => d.score));
  const agreeing = perCrit.filter(agreement).length;
  const consensus = criteria.length ? Math.round((agreeing / criteria.length) * 100) : 0;
  const avgDraft = average(perCrit.map(average));
  const done = criteria.filter((c) => finals[c.id] !== undefined).length;
  const progress = criteria.length ? Math.round((done / criteria.length) * 100) : 0;

  const metrics = [
    { label: "Rules passed", value: `${pass}/${r.checks.length}` },
    { label: "Stack items", value: String(r.stack.length) },
    { label: "Model agreement", value: `${consensus}%` },
    { label: "Avg. AI draft", value: `${avgDraft}/10` },
  ];
  const total = Math.max(1, pass + warn + fail);
  const slices = [
    { n: pass, color: "var(--pass)", label: "Pass" },
    { n: warn, color: "var(--warn)", label: "Warning" },
    { n: fail, color: "var(--fail)", label: "Fail" },
  ];
  const R = 15.9, C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <GlowCard accent="orange" label="Project health">
      <CardTitle accent="orange" right={<span className="text-xs text-muted-foreground">Prepared by AI · not a ranking</span>}>Project health</CardTitle>
      <div className="grid gap-4 lg:grid-cols-5">
        <ul className="grid gap-3 sm:grid-cols-2 lg:col-span-3">
          {metrics.map((m) => (
            <li key={m.label} className="rounded-2xl bg-well p-4">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="mt-1 text-2xl font-medium tabular-nums">{m.value}</p>
            </li>
          ))}
        </ul>
        <div className="rounded-2xl bg-well p-4 lg:col-span-2">
          <p className="text-xs text-muted-foreground">Rules check result</p>
          <div className="mt-2 flex items-center gap-4">
            <svg viewBox="0 0 36 36" className="size-28 shrink-0 -rotate-90" role="img" aria-label={`${pass} pass, ${warn} warning, ${fail} fail`}>
              <circle cx="18" cy="18" r={R} fill="none" stroke="var(--border)" strokeWidth="3.5" />
              {slices.map((s) => {
                const len = (s.n / total) * C;
                const el = s.n > 0 ? <circle key={s.label} cx="18" cy="18" r={R} fill="none" stroke={s.color} strokeWidth="3.5" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} /> : null;
                offset += len;
                return el;
              })}
            </svg>
            <ul className="space-y-1 text-sm">
              {slices.map((s) => (
                <li key={s.label} className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: s.color }} />{s.label} <span className="tabular-nums text-muted-foreground">{s.n}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-2xl bg-well p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium">Your review progress</p>
          <p className="text-2xl font-medium tabular-nums">{progress}%</p>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Review progress">
          <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{done} of {criteria.length} criteria have your final score.</p>
      </div>
    </GlowCard>
  );
}
