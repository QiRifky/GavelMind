import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { judgeTotal, newCriterionId, saveRubric, useApi, weightsValid, type Criterion } from "@/lib/api";
import { PageHead, Pill } from "@/components/ui-bits";

export const Route = createFileRoute("/rubric")({
  head: () => ({
    meta: [
      { title: "Rubric — GavelMind" },
      { name: "description", content: "Define and weight the criteria you judge by." },
      { property: "og:title", content: "Rubric — GavelMind" },
      { property: "og:description", content: "Define and weight the criteria you judge by." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Rubric,
});

function Rubric() {
  const { criteria, entries, finals } = useApi();
  const [draft, setDraft] = useState<Criterion[]>(criteria);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => { setDraft(criteria); }, [criteria]);
  const done = entries.filter((e) => e.status === "done");
  const [pick, setPick] = useState(done[0]?.id ?? "");
  const total = draft.reduce((s, c) => s + c.weight, 0);
  const valid = weightsValid(draft);
  const dirty = JSON.stringify(draft) !== JSON.stringify(criteria);
  const edit = (id: string, patch: Partial<Criterion>) => { setSaved(false); setDraft((d) => d.map((c) => (c.id === id ? { ...c, ...patch } : c))); };
  const before = judgeTotal(finals[pick], criteria);
  const after = valid ? judgeTotal(finals[pick], draft) : null;
  return (
    <>
      <PageHead eyebrow="Step 2 · Rubric" title="Your criteria, your weights.">
        Weights must add up to exactly 100% before you can save.
      </PageHead>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="glass p-3 sm:p-4">
          {draft.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No criteria yet. Add one below.</p>}
          <ul className="divide-y divide-border/70">
            {draft.map((c) => (
              <li key={c.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-2 py-3 sm:grid-cols-[minmax(0,1fr)_14rem_auto]">
                <input value={c.name} aria-label="Criterion name" onChange={(e) => edit(c.id, { name: e.target.value })}
                  className="min-w-0 rounded-xl border border-transparent bg-transparent px-2 py-1.5 font-medium hover:border-border focus:border-primary focus:outline-hidden" />
                <label className="col-span-2 row-start-2 flex items-center gap-3 sm:col-span-1 sm:row-start-auto">
                  <input type="range" min={0} max={100} value={c.weight} onChange={(e) => edit(c.id, { weight: Number(e.target.value) })} className="w-full accent-primary" aria-label={`Weight of ${c.name}`} />
                  <span className="w-12 text-right text-sm tabular-nums text-muted-foreground">{c.weight}%</span>
                </label>
                <button onClick={() => { setSaved(false); setDraft((d) => d.filter((x) => x.id !== c.id)); }} className="rounded-full px-3 py-1 text-sm text-muted-foreground hover:text-destructive">Remove</button>
              </li>
            ))}
          </ul>
          <form className="mt-3 flex gap-2 px-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { setSaved(false); setDraft((d) => [...d, { id: newCriterionId(), name: name.trim(), weight: 0 }]); setName(""); } }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New criterion" className="h-10 min-w-0 flex-1 rounded-full border border-border bg-background/60 px-4 text-sm focus:border-primary focus:outline-hidden" />
            <Pill type="submit" variant="outline" disabled={!name.trim()}>Add</Pill>
          </form>
          <div className="mt-4 flex flex-col gap-3 border-t border-border px-2 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p role="status" className={valid ? "text-sm text-muted-foreground" : "text-sm text-warn"}>
              Total: <span className="tabular-nums">{total}%</span>{valid ? "" : ` — weights must total 100% (${total > 100 ? `remove ${total - 100}` : `add ${100 - total}`}).`}
            </p>
            <div className="flex items-center gap-2">
              {saved && !dirty && <span className="text-sm text-success">Saved</span>}
              <Pill variant="outline" disabled={!dirty} onClick={() => setDraft(criteria)}>Reset</Pill>
              <Pill disabled={!valid || !dirty} onClick={() => setSaved(saveRubric(draft))}>Save</Pill>
            </div>
          </div>
        </section>
        <section className="glass p-5">
          <p className="eyebrow font-mono">Live preview</p>
          {done.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No analyzed projects to preview yet.</p> : (
            <>
              <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Project to preview"
                className="mt-3 h-10 w-full rounded-full border border-border bg-secondary px-4 text-sm">
                {done.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <dl className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-well p-3"><dt className="text-xs text-muted-foreground">Saved rubric</dt><dd className="mt-1 text-2xl tabular-nums">{before === null ? "—" : before.toFixed(2)}</dd></div>
                <div className="rounded-2xl bg-well p-3"><dt className="text-xs text-muted-foreground">With these edits</dt><dd className="mt-1 text-2xl tabular-nums text-primary">{after === null ? "—" : after.toFixed(2)}</dd></div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                {before === null ? "Totals appear once you've given a final score on every criterion for this project." : "Uses your final scores only, never the AI drafts."}
              </p>
            </>
          )}
        </section>
      </div>
    </>
  );
}
