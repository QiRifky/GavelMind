import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, Link2, Plus, Sparkles, Trash2 } from "lucide-react";
import { Badge, Pill } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { EventDetailsDialog } from "@/components/event-details-dialog";
import { StepBody, WorkflowNav } from "@/components/workflow-nav";
import { confirmEventRules, extractEventRules, newEventRuleId, updateEventRules, useApi } from "@/lib/api";

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

export function EventPage() {
  const { event } = useApi();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = "h-11 w-full min-w-0 rounded-xl border border-border bg-well px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring";
  const extract = async () => {
    setError(""); setBusy(true);
    try { await extractEventRules(); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't prepare rules."); }
    finally { setBusy(false); }
  };
  return <>
    <WorkflowNav current="event" />
    <StepBody className="flex flex-col gap-4">
    <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <section aria-label="Event details" className="flex min-w-0 flex-col bento ">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4"><p className="eyebrow font-mono">Event details</p><EventDetailsDialog key={event?.name ?? "empty"} edit /></header>
        <div className="space-y-4 px-5 py-5">
          {event ? <div><h2 className="break-words text-xl">{event.name}</h2><a href={event.url} target="_blank" rel="noreferrer" className="mt-2 flex items-start gap-2 break-all text-sm text-primary hover:underline"><Link2 className="mt-0.5 size-4 shrink-0" />{event.url}</a></div> : <p className="text-sm text-muted-foreground">No event details yet. Add a name and event link first.</p>}
          <div className="flex flex-wrap items-center gap-3"><Pill disabled onClick={() => void extract()}><Sparkles className="size-4" />Automatic rules unavailable</Pill>{event && <Badge tone={event.confirmed ? "good" : "accent"}>{event.confirmed ? "Confirmed by judge" : "Draft, not final"}</Badge>}</div>
          {error && <p role="alert" className="text-sm text-fail">{error}</p>}
        </div>
      </section>
      <section aria-label="Eligibility rules" className="flex min-w-0 flex-col bento  lg:min-h-0">
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4"><h2 className="text-lg">Eligibility rules</h2><span className="font-mono text-xs text-muted-foreground">{event?.rules.filter((r) => r.enabled).length ?? 0} active</span></header>
        <div className="flex-1 px-5 py-4">
          {!event?.rules.length && <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center"><Sparkles className="size-6 text-primary" /><p className="text-sm">No rules prepared yet.</p><p className="max-w-xs text-xs text-muted-foreground">Add rules from the official event page, then confirm them.</p></div>}
          <ul className="space-y-3">{event?.rules.map((r, i) => <li key={r.id} className="flex items-center gap-3 border-b border-border pb-3">
            <input type="checkbox" aria-label={`Enable rule ${i + 1}`} checked={r.enabled} disabled={busy} onChange={(e) => updateEventRules(event.rules.map((x) => x.id === r.id ? { ...x, enabled: e.target.checked } : x))} className="size-4 shrink-0 accent-(--brand) focus-visible:outline-2 focus-visible:outline-ring" />
            <input aria-label={`Rule ${i + 1}`} disabled={busy} value={r.label} onChange={(e) => updateEventRules(event.rules.map((x) => x.id === r.id ? { ...x, label: e.target.value } : x))} className={`${input} flex-1`} />
            <Button type="button" variant="ghost" size="icon" disabled={busy} aria-label={`Remove rule ${i + 1}`} title="Remove rule" onClick={() => updateEventRules(event.rules.filter((x) => x.id !== r.id))}><Trash2 className="size-4" /></Button>
          </li>)}</ul>
        </div>
        {event && <div className="flex flex-wrap gap-3 border-t border-border px-5 py-4"><Pill variant="outline" disabled={busy} onClick={() => updateEventRules([...event.rules, { id: newEventRuleId(), label: "", enabled: true }])}><Plus className="size-4" />Add rule</Pill><Pill disabled={busy || event.confirmed || !event.rules.some((r) => r.enabled) || event.rules.some((r) => r.enabled && !r.label.trim())} onClick={() => confirmEventRules()}><Check className="size-4" />Confirm rules</Pill></div>}
      </section>
    </div>
    <footer className="mt-4 flex shrink-0 flex-wrap items-center justify-between gap-4 border-t border-border pt-4"><Badge tone={event?.confirmed ? "good" : "neutral"}>{event?.confirmed ? "Rules confirmed by judge" : "Rules awaiting confirmation"}</Badge><Button asChild variant={event?.confirmed ? "default" : "outline"} className="rounded-full"><Link to="/app/rubric">{event?.confirmed ? "Continue to rubric" : "Go to rubric"} <ArrowRight /></Link></Button></footer>
    </StepBody>
  </>;
}