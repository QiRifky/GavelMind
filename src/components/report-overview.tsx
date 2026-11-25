import { Cell, Label, Pie, PieChart, ResponsiveContainer } from "recharts";
import { AlertTriangle, Gauge, ListChecks, Scale, ShieldCheck, Users } from "lucide-react";
import { agreement, average, draftsFor, finalsOf, judgeTotal, useApi, type Criterion, type Project, type Report } from "@/lib/api";
import { cn } from "@/lib/utils";

const BARS = 24;
const STRENGTH = [100, 70, 45, 25, 15, 10];

/** Report overview in the metrics-card layout. Donut centre shows the judge's final score only. */
export function ReportOverview({ r, project, criteria }: { r: Report; project: Project; criteria: Criterion[] }) {
  const state = useApi();
  const finals = finalsOf(project.id, state);
  const total = judgeTotal(finals, criteria);
  const decided = criteria.filter((c) => finals[c.id] !== undefined).length;
  const reviewPct = criteria.length ? Math.round((decided / criteria.length) * 100) : 0;
  const draftAvgs = criteria.map((c) => average(draftsFor(r, c).map((d) => d.score)));
  const draftAvg = average(draftAvgs);
  const agreeCount = criteria.filter((c) => agreement(draftsFor(r, c).map((d) => d.score))).length;
  const passCount = r.checks.filter((c) => c.result === "pass").length;
  const flagCount = r.checks.filter((c) => c.result !== "pass").length;
  const filled = Math.round((reviewPct * BARS) / 100);
  const owner = project.repoUrl.replace(/^https?:\/\/(www\.)?github\.com\//, "").split("/")[0] ?? "";

  const metrics = [
    { icon: Gauge, title: "AI draft average", value: `${draftAvg}/10` },
    { icon: Users, title: "Model agreement", value: `${agreeCount}/${criteria.length} criteria` },
    { icon: ListChecks, title: "Rule checks", value: `${passCount}/${r.checks.length} pass` },
    { icon: AlertTriangle, title: "Flags to review", value: String(flagCount), warn: flagCount > 0 },
  ];
  const slices = criteria.map((c, i) => ({ id: c.id, name: c.name, value: c.weight, strength: STRENGTH[i] ?? 10 }));
  const bars = Array.from({ length: BARS }, (_, i) => ({ i, v: i < filled ? 1 : 0 }));

  return (
    <section aria-label="Report overview" className="glass rounded-3xl p-4 sm:p-5">
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="flex flex-col justify-between gap-6 lg:col-span-3">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">Report overview</p>
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-lg font-semibold text-primary">{project.name.slice(0, 1).toUpperCase()}</span>
            <div className="min-w-0">
              <p className="truncate text-xl font-medium">{project.name}</p>
              <p className="truncate font-mono text-sm text-muted-foreground">github.com/{owner}</p>
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {metrics.map((m) => (
              <li key={m.title} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-border bg-well px-4 py-3">
                <span className={cn("flex size-9 items-center justify-center rounded-lg", m.warn ? "bg-warn/15 text-warn" : "bg-primary/15 text-primary")}><m.icon className="size-5" /></span>
                <div className="min-w-0">
                  <p className="truncate text-sm text-muted-foreground">{m.title}</p>
                  <p className="truncate font-mono text-lg font-medium tabular-nums">{m.value}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-border bg-well p-4 lg:col-span-2">
          <p className="text-lg font-semibold">Judge's final score</p>
          <div className="h-40 w-full" role="img" aria-label={`Rubric weights: ${slices.map((s) => `${s.name} ${s.value}%`).join(", ")}`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={slices} dataKey="value" nameKey="name" startAngle={300} endAngle={660} innerRadius={58} outerRadius={75} paddingAngle={2} stroke="none" isAnimationActive={false}>
                  {slices.map((s) => <Cell key={s.id} fill={`color-mix(in oklab, var(--primary) ${s.strength}%, transparent)`} />)}
                  <Label content={({ viewBox }) => {
                    if (!viewBox || !("cx" in viewBox)) return null;
                    const cx = viewBox.cx ?? 0, cy = viewBox.cy ?? 0;
                    return (
                      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={cx} y={cy - 10} className="fill-foreground font-mono text-xl font-medium">{total === null ? "—" : total.toFixed(1)}</tspan>
                        <tspan x={cx} y={cy + 16} className="fill-muted-foreground text-xs">{total === null ? "Awaiting judge" : "out of 10"}</tspan>
                      </text>
                    );
                  }} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {slices.map((s) => <li key={s.id} className="flex items-center gap-1.5"><span className="size-2 rounded-[2px]" style={{ background: `color-mix(in oklab, var(--primary) ${s.strength}%, transparent)` }} />{s.name} {s.value}%</li>)}
          </ul>
          <div className="flex items-center justify-between"><span className="text-sm">Criteria decided</span><span className="font-mono text-xl font-medium tabular-nums">{decided}/{criteria.length}</span></div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 rounded-2xl border border-border bg-well p-4 lg:grid-cols-5">
        <div className="flex flex-col justify-center gap-2">
          <p className="text-lg font-semibold">Review progress</p>
          <p className="font-mono text-5xl tabular-nums">{reviewPct}%</p>
          <p className="text-sm text-muted-foreground">Criteria with your final score</p>
        </div>
        <div className="flex flex-col gap-4 lg:col-span-4">
          <p className="font-medium">Before you finalize</p>
          <p className="text-sm text-muted-foreground">AI scores are suggestions to help you decide. Read the flags and evidence, then set a final score for every criterion.</p>
          <ul className="grid gap-3 text-sm md:grid-cols-2">
            <li className="flex items-center gap-2"><ShieldCheck className={cn("size-5", flagCount ? "text-warn" : "text-pass")} />{flagCount ? `${flagCount} rule check${flagCount > 1 ? "s need" : " needs"} a look` : "All rule checks passed"}</li>
            <li className="flex items-center gap-2"><Scale className="size-5 text-primary" />{r.material.repository.run.status === "worked" ? "Sandbox run worked" : `Sandbox run: ${r.material.repository.run.status}`}</li>
          </ul>
          <div className="grid h-8 w-full gap-1 sm:gap-2" style={{ gridTemplateColumns: `repeat(${BARS}, minmax(0, 1fr))` }} role="img" aria-label={`Review progress ${reviewPct}%`}>
            {bars.map((b) => <span key={b.i} className={cn("rounded-full", b.v === 1 ? "bg-primary" : "bg-primary/12")} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
