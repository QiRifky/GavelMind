import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { draftTotal, judgeTotal, newCriterionId, saveRubric, useApi, weightSum, type Criterion } from "@/lib/api";
import { PageHead, Pill } from "@/components/ui-bits";

export const Route = createFileRoute("/app/rubric")({
  head: () => ({
    meta: [
      { title: "Rubric — GavelMind" },
      { name: "description", content: "Define and weight the criteria you judge by. Weights total 100%." },
      { property: "og:title", content: "Rubric — GavelMind" },
      { property: "og:description", content: "Define and weight the criteria you judge by. Weights total 100%." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Rubric,
});

function Rubric() {
  const s = useApi();
  const [draft, setDraft] = useState<Criterion[]>(s.criteria);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => setDraft(s.criteria), [s.criteria]);
  const done = s.projects.filter((p) => p.status === "done");
  const [pid, setPid] = useState(done[0]?.id ?? "");
  const sum = weightSum(draft);
  const dirty = JSON.stringify(draft) !== JSON.stringify(s.criteria);
  const valid = sum === 100 && draft.length > 0 && draft.every((c) => c.name.trim());
  const upd = (id: string, patch: Partial<Criterion>) => setDraft(draft.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const finals = s.finals[pid];
  const report = s.reports[pid];
  const before = judgeTotal(finals, s.criteria);
  const after = judgeTotal(finals, draft);
  const dBefore = draftTotal(report, s.criteria);
  const dAfter = draftTotal(report, draft);

  return (
    <>
      <PageHead eyebrow="Step 2 · Rubric" title="Decide what matters.">Weights must total 100%. Changes are recorded in the change log.</PageHead>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section aria-label="Criteria" className="glass p-5 sm:p-6">
          {draft.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No criteria. Add one below.</p> : (
            <ul className="space-y-4">
              {draft.map((c) => (
                <li key={c.id} className="rounded-2xl bg-well p-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                    <input aria-label="Criterion name" value={c.name} onChange={(e) => upd(c.id, { name: e.target.value })} className="h-10 min-w-0 rounded-full border border-border bg-secondary px-4 text-sm outline-hidden focus:border-primary" />
                    <button onClick={() => setDraft(draft.filter((x) => x.id !== c.id))} aria-label={`Remove ${c.name}`} className="rounded-full px-3 py-1 text-sm text-muted-foreground hover:text-destructive">Remove</button>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <input type="range" min={0} max={100} value={c.weight} aria-label={`Weight of ${c.name}`} onChange={(e) => upd(c.id, { weight: Number(e.target.value) })} className="flex-1 accent-(--brand)" />
                    <span className="w-12 text-right tabular-nums">{c.weight}%</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { setDraft([...draft, { id: newCriterionId(), name: name.trim(), weight: 0 }]); setName(""); } }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New criterion" aria-label="New criterion" className="h-10 min-w-0 flex-1 rounded-full border border-border bg-well px-4 text-sm outline-hidden focus:border-primary" />
            <Pill variant="outline" type="submit" disabled={!name.trim()}>Add</Pill>
          </form>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className={sum === 100 ? "text-sm text-pass" : "text-sm text-warn"} role="status">Total {sum}%{sum !== 100 && ` — must be 100% (${sum > 100 ? `${sum - 100} over` : `${100 - sum} short`})`}</p>
            <div className="flex gap-2">
              <Pill variant="outline" disabled={!dirty} onClick={() => setDraft(s.criteria)}>Reset</Pill>
              <Pill disabled={!valid || !dirty || saving || s.finalized} onClick={async () => { setSaving(true); setMsg(null); try { await saveRubric(draft); setMsg("Saved."); } catch (e) { setMsg(e instanceof Error ? e.message : "Save failed."); } finally { setSaving(false); } }}>{saving ? "Saving…" : "Save rubric"}</Pill>
            </div>
          </div>
          {s.finalized && <p className="mt-2 text-sm text-muted-foreground">Results are finalized. Reopen them to change the rubric.</p>}
          {msg && <p className="mt-2 text-sm text-muted-foreground">{msg}</p>}
        </section>
        <section aria-label="Live preview" className="glass self-start p-5 sm:p-6">
          <p className="eyebrow font-mono">Live preview</p>
          {done.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Analyze a project to preview totals.</p> : (
            <>
              <select aria-label="Preview project" value={pid} onChange={(e) => setPid(e.target.value)} className="mt-3 h-10 w-full rounded-full border border-border bg-secondary px-3 text-sm">
                {done.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="rounded-2xl bg-well p-3">
                  <dt className="text-muted-foreground">Judge's final total</dt>
                  <dd className="text-lg tabular-nums">{before === null ? "Awaiting judge review" : <>{before.toFixed(2)} → <span className="text-primary">{after?.toFixed(2) ?? "—"}</span></>}</dd>
                </div>
                <div className="rounded-2xl bg-well p-3">
                  <dt className="text-muted-foreground">AI draft total (suggestion, not ranked)</dt>
                  <dd className="tabular-nums">{dBefore?.toFixed(2) ?? "—"} → {dAfter?.toFixed(2) ?? "—"}</dd>
                </div>
              </dl>
            </>
          )}
        </section>
      </div>
    </>
  );
}
