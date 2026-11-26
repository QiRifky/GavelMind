import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, Link2, Plus, Sparkles, Trash2 } from "lucide-react";
import { Badge, PageHead, Pill } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { EventDetailsDialog } from "@/components/event-details-dialog";
import { WorkflowNav } from "@/components/workflow-nav";
import { confirmEventRules, eventRubricSuggestions, extractEventRules, newEventRuleId, saveRubric, updateEventRules, useApi } from "@/lib/api";

export const Route = createFileRoute("/app/event")({
  head: () => ({ meta: [
    { title: "Event — Gavel Mind" },
    { name: "description", content: "Prepare event requirements and confirm the rules for participant review." },
    { property: "og:title", content: "Event — Gavel Mind" },
    { property: "og:description", content: "Prepare event requirements and confirm the rules for participant review." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: EventPage,
});

function EventPage() {
  const { event } = useApi();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);
  const suggestions = eventRubricSuggestions();
  const input = "h-11 w-full min-w-0 rounded-xl border border-border bg-well px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring";
  const extract = async () => {
    setError(""); setBusy(true);
    try { await extractEventRules(); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't prepare rules."); }
    finally { setBusy(false); }
  };
  return <>
    <PageHead eyebrow="Event" title="Set the ground rules.">Name the event and confirm the eligibility rules before judging starts.</PageHead>
    <WorkflowNav current="event" />
    <div role="note" className="mb-6 border-l-2 border-primary bg-accent p-4 text-sm text-accent-foreground">Mock mode · The event URL is not read. Rule drafts and rubric suggestions are examples, not extracted event requirements. Changes reset on reload.</div>
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="min-w-0">
        <section className="space-y-4 border-b border-border pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><p className="eyebrow font-mono">Event details</p><EventDetailsDialog key={event?.name ?? "empty"} edit /></div>
          {event ? <div><h2 className="break-words text-xl">{event.name}</h2><a href={event.url} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sm text-primary hover:underline">{event.url}</a></div> : <p className="text-sm text-muted-foreground">No event details yet.</p>}
          <div className="flex flex-wrap gap-3"><Pill disabled={busy || !event} onClick={() => void extract()}><Sparkles className="size-4" />{busy ? "Preparing sample rules…" : "Prepare sample rule draft"}</Pill>{event && <Badge tone={event.confirmed ? "good" : "accent"}>{event.confirmed ? "Confirmed by judge" : "Draft, not final"}</Badge>}</div>
          {error && <p role="alert" className="text-sm text-fail">{error}</p>}
        </section>
        <section aria-label="Eligibility rules" className="mt-6">
          <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg">Eligibility rules</h2><span className="font-mono text-xs text-muted-foreground">{event?.rules.filter((r) => r.enabled).length ?? 0} active</span></div>
          {!event?.rules.length && <p className="py-6 text-sm text-muted-foreground">No rules prepared yet.</p>}
          <ul className="space-y-3">{event?.rules.map((r, i) => <li key={r.id} className="flex items-center gap-3 border-b border-border pb-3">
            <input type="checkbox" aria-label={`Enable rule ${i + 1}`} checked={r.enabled} disabled={busy} onChange={(e) => updateEventRules(event.rules.map((x) => x.id === r.id ? { ...x, enabled: e.target.checked } : x))} className="size-4 shrink-0 accent-(--brand) focus-visible:outline-2 focus-visible:outline-ring" />
            <input aria-label={`Rule ${i + 1}`} disabled={busy} value={r.label} onChange={(e) => updateEventRules(event.rules.map((x) => x.id === r.id ? { ...x, label: e.target.value } : x))} className={`${input} flex-1`} />
            <Button type="button" variant="ghost" size="icon" disabled={busy} aria-label={`Remove rule ${i + 1}`} title="Remove rule" onClick={() => updateEventRules(event.rules.filter((x) => x.id !== r.id))}><Trash2 className="size-4" /></Button>
          </li>)}</ul>
          {event && <div className="mt-5 flex flex-wrap gap-3"><Pill variant="outline" disabled={busy} onClick={() => updateEventRules([...event.rules, { id: newEventRuleId(), label: "", enabled: true }])}><Plus className="size-4" />Add rule</Pill><Pill disabled={busy || event.confirmed || !event.rules.some((r) => r.enabled) || event.rules.some((r) => r.enabled && !r.label.trim())} onClick={() => confirmEventRules()}><Check className="size-4" />Confirm rules</Pill></div>}
        </section>
      </div>
      <aside className="min-w-0 space-y-6 border-t border-border pt-6 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
        <section><p className="eyebrow font-mono">Event source</p>{event ? <><h2 className="mt-3 break-words text-xl">{event.name}</h2><a href={event.url} target="_blank" rel="noreferrer" className="mt-3 flex items-start gap-2 break-all text-sm text-primary"><Link2 className="mt-0.5 size-4 shrink-0" />{event.url}</a></> : <p className="mt-3 text-sm text-muted-foreground">No event selected.</p>}</section>
        {event?.rules.length ? <section className="border-t border-border pt-6"><p className="eyebrow font-mono">Suggested rubric · sample</p><dl className="mt-4 space-y-3">{suggestions.map((c) => <div key={c.id} className="flex justify-between gap-3 text-sm"><dt>{c.name}</dt><dd className="font-mono text-primary">{c.weight}%</dd></div>)}</dl><Pill variant="outline" className="mt-5" onClick={() => { if (window.confirm("Replace the current rubric with these sample criteria and weights?")) setApplied(saveRubric(suggestions)); }}>Apply sample rubric</Pill>{applied && <p role="status" className="mt-3 text-sm text-pass">Rubric updated.</p>}</section> : null}
        <p className="border-t border-border pt-5 text-sm text-muted-foreground">Rules and eligibility findings are drafts for judge review. Only the judge makes the final decision.</p>
      </aside>
    </div>
    <footer className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5"><Badge tone={event?.confirmed ? "good" : "neutral"}>{event?.confirmed ? "Rules confirmed by judge" : "Rules awaiting confirmation"}</Badge>{event?.confirmed && <Button asChild className="rounded-full"><Link to="/app/entries">Continue to entries <ArrowRight /></Link></Button>}</footer>
  </>;
}