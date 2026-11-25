import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { addCriterion, removeCriterion, renameCriterion, setWeight, useApi } from "@/lib/api";
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
  const { criteria } = useApi();
  const [name, setName] = useState("");
  const total = criteria.reduce((s, c) => s + c.weight, 0);
  return (
    <>
      <PageHead eyebrow="Step 2 · Rubric" title="Your criteria, your weights.">
        Weights are relative; they don't need to add up to 100. Total now: <span className="tabular-nums text-foreground">{total}</span>.
      </PageHead>
      <section className="glass p-3 sm:p-4">
        <ul className="divide-y divide-border/70">
          {criteria.map((c) => (
            <li key={c.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-2 py-3 sm:grid-cols-[minmax(0,1fr)_14rem_auto]">
              <input defaultValue={c.name} aria-label="Criterion name" onBlur={(e) => renameCriterion(c.id, e.target.value)}
                className="min-w-0 rounded-xl border border-transparent bg-transparent px-2 py-1.5 font-medium hover:border-border focus:border-primary focus:outline-hidden" />
              <label className="col-span-2 row-start-2 flex items-center gap-3 sm:col-span-1 sm:row-start-auto">
                <input type="range" min={0} max={100} value={c.weight} onChange={(e) => setWeight(c.id, Number(e.target.value))} className="w-full accent-primary" aria-label={`Weight of ${c.name}`} />
                <span className="w-12 text-right text-sm tabular-nums text-muted-foreground">{total ? Math.round((c.weight / total) * 100) : 0}%</span>
              </label>
              <button onClick={() => removeCriterion(c.id)} className="rounded-full px-3 py-1 text-sm text-muted-foreground hover:text-destructive">Remove</button>
            </li>
          ))}
        </ul>
        <form className="mt-3 flex gap-2 px-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { addCriterion(name.trim()); setName(""); } }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New criterion" className="h-10 min-w-0 flex-1 rounded-full border border-border bg-secondary px-4 text-sm focus:border-primary focus:outline-hidden" />
          <Pill type="submit" disabled={!name.trim()}>Add</Pill>
        </form>
      </section>
    </>
  );
}
