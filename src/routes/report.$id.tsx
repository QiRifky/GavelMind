import { createFileRoute, Link } from "@tanstack/react-router";
import { draftFor, judgeTotal, setFinal, useApi, voice } from "@/lib/api";
import { AiNotice, Badge, PageHead } from "@/components/ui-bits";

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

function ReportPage() {
  const { id } = Route.useParams();
  const { entries, reports, criteria, finals, finalized, tone } = useApi();
  const entry = entries.find((e) => e.id === id);
  const report = reports[id];
  if (!entry || !report) {
    return (
      <div className="glass p-8 text-center">
        <p>This report isn't ready.</p>
        <Link to="/" className="mt-3 inline-block text-primary">Back to entries</Link>
      </div>
    );
  }
  const mine = finals[id] ?? {};
  const total = judgeTotal(mine, criteria);
  const runTone = report.run.status === "worked" ? "good" : "bad";
  return (
    <>
      <PageHead eyebrow="Report card" title={entry.name}>
        <a href={entry.url} target="_blank" rel="noreferrer" className="text-sm underline-offset-4 hover:underline">{entry.url}</a>
      </PageHead>
      <div className="mb-6"><AiNotice /></div>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="glass p-6 lg:col-span-2">
          <p className="eyebrow">AI summary</p>
          <p className="mt-3 leading-relaxed">{voice(tone, "intro")}{report.summary.join(" ")}</p>
        </section>
        <section className="glass p-6">
          <p className="eyebrow">Run status</p>
          <div className="mt-3"><Badge tone={runTone}>{report.run.status}</Badge></div>
          <p className="mt-3 rounded-xl bg-muted p-3 font-mono text-xs leading-relaxed">{report.run.evidence}</p>
        </section>
        {report.flags.length > 0 && (
          <section className="glass p-6 lg:col-span-3">
            <p className="eyebrow">Flags · {voice(tone, "flag")}</p>
            <ul className="mt-3 space-y-2">
              {report.flags.map((f) => (
                <li key={f} className="flex gap-2 text-sm"><span className="text-primary">⚑</span>{f}</li>
              ))}
            </ul>
          </section>
        )}
        <section className="glass p-3 sm:p-5 lg:col-span-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-2">
            <p className="eyebrow">Scores · out of 10</p>
            <p className="text-sm text-muted-foreground">
              Your weighted total: <span className="font-medium tabular-nums text-foreground">{total === null ? "not decided yet" : total.toFixed(2)}</span>
              {finalized && " · results are final, editing is locked"}
            </p>
          </div>
          <ul className="divide-y divide-border/70">
            {criteria.map((c) => {
              const d = draftFor(id, c);
              const v = mine[c.id];
              return (
                <li key={c.id} className="grid gap-4 px-2 py-4 md:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="min-w-0">
                    <p className="font-medium">{c.name} <span className="text-xs text-muted-foreground">· weight {c.weight}</span></p>
                    <p className="mt-1 text-sm">{voice(tone, "reason", d.reason)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Evidence: {d.evidence}</p>
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="rounded-2xl border border-dashed border-border px-3 py-2 text-center">
                      <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">AI draft</p>
                      <p className="text-lg tabular-nums text-muted-foreground">{d.score}</p>
                    </div>
                    <label className="rounded-2xl border border-primary/40 bg-background/70 px-3 py-2 text-center">
                      <span className="block text-[0.65rem] uppercase tracking-wider text-accent-foreground">Judge's decision</span>
                      <input type="number" min={0} max={10} step={0.5} disabled={finalized} value={v ?? ""} placeholder="—"
                        onChange={(e) => setFinal(id, c.id, e.target.value === "" ? null : Math.min(10, Math.max(0, Number(e.target.value))))}
                        className="w-16 bg-transparent text-center text-lg tabular-nums focus:outline-hidden" aria-label={`Final score for ${c.name}`} />
                    </label>
                    {!finalized && v === undefined && (
                      <button onClick={() => setFinal(id, c.id, d.score)} className="mb-1 rounded-full border border-border px-3 py-1 text-xs hover:bg-card">Accept draft</button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
