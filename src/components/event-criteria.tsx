import { useEffect, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { Badge, Pill } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { canSaveRubric, confirmEventCriteria, CRITERION_PRESETS, newCriterionId, useApi, weightTotal, type Criterion } from "@/lib/api";

type Draft = Criterion & { quote?: string };
const CUSTOM = "__custom__";

export function EventCriteria({ busy }: { busy: boolean }) {
  const state = useApi();
  const { event, criteria, finalized } = state;
  const [draft, setDraft] = useState<Draft[]>(criteria);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    const next = event?.criteriaDraft;
    setDraft(next?.length && !event?.criteriaConfirmed ? next.map((c) => ({
      id: criteria.find((active) => active.name.toLowerCase() === c.name.toLowerCase())?.id ?? newCriterionId(),
      name: c.name, weight: c.weight, quote: c.quote,
    })) : criteria.map((c) => {
      const quote = next?.find((source) => source.name === c.name)?.quote;
      return { ...c, ...(quote ? { quote } : {}) };
    }));
    setDirty(false);
  }, [event?.criteriaDraft, event?.criteriaConfirmed, event?.url, state.activeFolderId, criteria]);
  const edit = (id: string, patch: Partial<Draft>) => { setDirty(true); setDraft((rows) => rows.map((c) => c.id === id ? { ...c, ...patch } : c)); };
  const total = weightTotal(draft);
  const confirmed = event?.criteriaConfirmed && !dirty;
  const disabled = busy || finalized;

  return <section aria-label="Scoring criteria" className="bento min-w-0 scroll-mt-24">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
      <h2 className="text-lg">Scoring criteria</h2><Badge tone={confirmed ? "good" : "accent"}>{confirmed ? "Confirmed by judge" : "Draft, not final"}</Badge>
    </header>
    <div className="px-4 py-4 sm:px-5">
      {event?.criteriaDraft?.length ? <p className="mb-4 text-sm text-muted-foreground">{event.criteriaDraft.some((c) => c.weightSource === "suggested") ? "Page-backed criteria · suggested equal weights" : "Criteria and weights from the event page"}</p> : <p className="mb-4 text-sm text-muted-foreground">{event?.criteriaDraft ? "No supported criteria found on the event page. Current criteria remain unchanged." : "Current criteria · awaiting event page review"}</p>}
      <ul className="grid gap-x-6 gap-y-5 lg:grid-cols-2">{draft.map((c, i) => <li key={c.id} className="min-w-0 border-t border-border pt-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          {CRITERION_PRESETS.some((p) => p.name === c.name) ? <Select disabled={disabled} value={c.name} onValueChange={(value) => edit(c.id, { name: value === CUSTOM ? "" : value })}>
            <SelectTrigger aria-label={`Criterion ${i + 1}`} className="min-h-16 w-full whitespace-normal text-left [&>span]:line-clamp-none"><SelectValue /></SelectTrigger>
            <SelectContent>{CRITERION_PRESETS.map((p) => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}<SelectItem value={CUSTOM}>Custom name…</SelectItem></SelectContent>
          </Select> : <textarea rows={2} aria-label={`Criterion ${i + 1}`} value={c.name} disabled={disabled} onChange={(e) => edit(c.id, { name: e.target.value })} className="h-16 w-full min-w-0 resize-none rounded-lg border border-border bg-well px-3 py-2 text-sm leading-relaxed focus-visible:outline-2 focus-visible:outline-ring" />}
          <Button variant="ghost" size="icon" disabled={disabled} aria-label={`Remove criterion ${i + 1}`} title="Remove criterion" onClick={() => { setDirty(true); setDraft((rows) => rows.filter((row) => row.id !== c.id)); }}><Trash2 className="size-4" /></Button>
        </div>
        {c.quote && <blockquote className="mt-3 break-words border-l-2 border-primary/40 pl-3 text-xs leading-relaxed text-muted-foreground">“{c.quote}” <a href={event?.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">Event source</a></blockquote>}
        <div className="mt-3 flex items-center gap-3"><input aria-label={`Criterion ${i + 1} weight`} type="range" min="0" max="100" step="1" value={c.weight} disabled={disabled} onChange={(e) => edit(c.id, { weight: Number(e.target.value) })} className="min-w-0 flex-1 accent-(--brand)" /><span className="w-12 text-right font-mono text-sm">{c.weight}%</span></div>
      </li>)}</ul>
      {!draft.length && <p className="text-sm text-muted-foreground">No criteria yet.</p>}
    </div>
    <footer className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-4 sm:px-5">
      <Pill variant="outline" disabled={disabled || !event} onClick={() => { setDirty(true); setDraft((rows) => [...rows, { id: newCriterionId(), name: "Creativity", weight: 0 }]); }}><Plus className="size-4" />Add criterion</Pill>
      <Pill disabled={disabled || !event || Boolean(confirmed) || !canSaveRubric(draft)} onClick={() => confirmEventCriteria(draft.map(({ id, name, weight }) => ({ id, name, weight })))}><Check className="size-4" />Confirm criteria</Pill>
      <span className={`font-mono text-xs ${total === 100 ? "text-muted-foreground" : "text-warn"}`}>Total {total}%</span>
      {finalized && <span className="text-xs text-muted-foreground">Results finalized · criteria locked</span>}
    </footer>
  </section>;
}