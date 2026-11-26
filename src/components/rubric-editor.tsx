import { useEffect, useState } from "react";
import { canSaveRubric, finalsOf, judgeTotal, newCriterionId, saveRubric, useApi, weightTotal, type Criterion } from "@/lib/api";
import { Pill } from "@/components/ui-bits";
import { Trash2 } from "lucide-react";

export function RubricEditor() {
  const state = useApi();
  const [draft, setDraft] = useState<Criterion[]>(state.criteria);
  const [saved, setSaved] = useState(false);
  useEffect(() => { setDraft(state.criteria); }, [state.criteria]);
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
      <div className="mb-4 flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full border border-border font-mono text-sm text-muted-foreground">3</span><div><h2 className="text-lg">Set what you judge on</h2><p className="mt-0.5 text-sm text-muted-foreground">Name each criterion and drag its weight. Weights must add up to 100%, then save.</p></div></div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="glass p-5 sm:p-6" aria-label="Criteria">
          {draft.length === 0 && <p className="mb-4 text-sm text-muted-foreground">No criteria. Add one to start.</p>}
          <div className="mb-5" aria-hidden><div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-well">{draft.map((c, i) => <div key={c.id} style={{ width: `${Math.min(c.weight, 100)}%`, opacity: Math.max(0.35, 1 - i * 0.18) }} className="h-full bg-primary" />)}</div><div className="mt-2 flex justify-between font-mono text-xs"><span className="text-muted-foreground">Weight split</span><span className={total === 100 ? "text-pass" : "text-warn"}>{total}% / 100%</span></div></div>
          <ul className="space-y-3">
            {draft.map((c) => (
              <li key={c.id} className="rounded-2xl bg-well p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <input aria-label="Criterion name" value={c.name} onChange={(e) => edit(c.id, { name: e.target.value })} className="h-10 min-w-0 rounded-xl border border-border bg-transparent px-3 outline-hidden focus:border-primary" />
                  <button aria-label={`Remove ${c.name}`} onClick={() => { setSaved(false); setDraft((d) => d.filter((x) => x.id !== c.id)); }} title="Remove criterion" className="rounded-full p-2 text-muted-foreground hover:text-destructive focus-visible:outline-2 focus-visible:outline-ring"><Trash2 className="size-4" /></button>
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
