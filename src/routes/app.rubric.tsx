import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { canSaveRubric, finalsOf, judgeTotal, newCriterionId, saveRubric, useApi, weightTotal, type Criterion } from "@/lib/api";
import { PageHead, Pill } from "@/components/ui-bits";

export const Route = createFileRoute("/app/rubric")({
  head: () => ({ meta: [{ title: "Rubric — GavelMind" }, { name: "description", content: "Set the criteria and weights you judge with." }, { property: "og:title", content: "Rubric — GavelMind" }, { property: "og:description", content: "Set the criteria and weights you judge with." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Rubric,
});

function Rubric() {
  const state = useApi();
  const [draft, setDraft] = useState<Criterion[]>(state.criteria);
  const [saved, setSaved] = useState(false);
  const total = weightTotal(draft);
  const ok = canSaveRubric(draft);
  const dirty = JSON.stringify(draft) !== JSON.stringify(state.criteria);
  const edit = (id: string, patch: Partial<Criterion>) => { setSaved(false); setDraft((d) => d.map((c) => (c.id === id ? { ...c, ...patch } : c))); };
  const withFinals = state.projects.filter((p) => Object.keys(finalsOf(p.id, state)).length > 0);
  const [pid, setPid] = useState(withFinals[0]?.id ?? "");
  const finals = finalsOf(pid, state);
  const fmt = (t: number | null) => (t === null ? "Awaiting judge review" : t.toFixed(2));

  return (
    <>
      <PageHead eyebrow="Rubric" title="What you judge on.">Weights must add up to 100%. Changes apply after you save.</PageHead>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="glass p-5 sm:p-6" aria-label="Criteria">
          {draft.length === 0 && <p className="mb-4 text-sm text-muted-foreground">No criteria. Add one to start.</p>}
          <ul className="space-y-4">
            {draft.map((c) => (
              <li key={c.id} className="rounded-2xl bg-well p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <input aria-label="Criterion name" value={c.name} onChange={(e) => edit(c.id, { name: e.target.value })} className="h-10 min-w-0 rounded-xl border border-border bg-transparent px-3 outline-hidden focus:border-primary" />
                  <button aria-label={`Remove ${c.name}`} onClick={() => { setSaved(false); setDraft((d) => d.filter((x) => x.id !== c.id)); }} className="rounded-full px-3 py-1 text-sm text-muted-foreground hover:text-destructive">Remove</button>
                </div>
                <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <input type="range" min={0} max={100} step={5} value={c.weight} aria-label={`${c.name} weight`} onChange={(e) => edit(c.id, { weight: Number(e.target.value) })} className="w-full accent-(--brand)" />
                  <span className="w-12 text-right font-mono text-sm">{c.weight}%</span>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Pill variant="outline" onClick={() => { setSaved(false); setDraft((d) => [...d, { id: newCriterionId(), name: "New criterion", weight: 0 }]); }}>Add criterion</Pill>
            <Pill disabled={!ok || !dirty} onClick={() => { if (saveRubric(draft)) setSaved(true); }}>Save rubric</Pill>
            <span className={`font-mono text-sm ${total === 100 ? "text-pass" : "text-warn"}`}>Total {total}%</span>
            {saved && !dirty && <span className="text-sm text-muted-foreground">Saved.</span>}
          </div>
          {total !== 100 && <p role="alert" className="mt-3 text-sm text-warn">Weights add up to {total}%. Adjust them to exactly 100% to save.</p>}
        </section>
        <section className="glass p-5 sm:p-6" aria-label="Live preview">
          <p className="eyebrow font-mono">Live preview</p>
          {withFinals.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Score a project first to see how the rubric changes its total.</p> : (
            <>
              <select aria-label="Project" value={pid} onChange={(e) => setPid(e.target.value)} className="mt-3 h-10 w-full rounded-full border border-border bg-secondary px-3 text-sm">
                {withFinals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <dl className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-well p-3"><dt className="text-xs text-muted-foreground">Current total</dt><dd className="mt-1 font-mono">{fmt(judgeTotal(finals, state.criteria))}</dd></div>
                <div className="rounded-2xl bg-well p-3"><dt className="text-xs text-muted-foreground">With these edits</dt><dd className="mt-1 font-mono text-primary">{fmt(judgeTotal(finals, draft))}</dd></div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">Uses only your final scores. New criteria without a score keep the total pending.</p>
            </>
          )}
        </section>
      </div>
    </>
  );
}
