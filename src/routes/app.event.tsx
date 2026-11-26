import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ArrowRight, Check, Link2, Plus, Sparkles, Trash2 } from "lucide-react";
import { Badge, PageHead, Pill } from "@/components/ui-bits";
import { RubricEditor } from "@/components/rubric-editor";
import { Button } from "@/components/ui/button";
import { confirmEventRules, eventRubricSuggestions, extractEventRules, newEventRuleId, saveEvent, saveRubric, updateEventRules, useApi, weightTotal } from "@/lib/api";

export const Route = createFileRoute("/app/event")({
  head: () => ({ meta: [
    { title: "Event & Rubric — Gavel Mind" },
    { name: "description", content: "Prepare event requirements and confirm the rules for participant review." },
    { property: "og:title", content: "Event & Rubric — Gavel Mind" },
    { property: "og:description", content: "Prepare event requirements and confirm the rules for participant review." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: EventPage,
});

function EventPage() {
  const { event, criteria } = useApi();
  const [name, setName] = useState(event?.name ?? "");
  const [url, setUrl] = useState(event?.url ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);
  const dirty = name.trim() !== event?.name || url.trim() !== event?.url;
  const suggestions = eventRubricSuggestions();
  const input = "h-11 w-full min-w-0 rounded-xl border border-border bg-well px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring";
  const extract = async () => {
    setError(""); setBusy(true);
    try { if (!event || dirty) saveEvent(name, url); await extractEventRules(); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't prepare rules."); }
    finally { setBusy(false); }
  };
  return <>
    <PageHead eyebrow="Event & Rubric" title="Set the ground rules.">Eligibility rules and scoring criteria in one place, before judging starts.</PageHead>
    <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground"><span className="text-primary">01 Event & Rubric</span><ArrowRight className="size-4" /><Link to="/app">02 Entries</Link><ArrowRight className="size-4" /><Link to="/app/results">03 Results</Link></div>
    <div role="note" className="mb-6 border-l-2 border-primary bg-accent p-4 text-sm text-accent-foreground">Mock mode · The event URL is not read. Rule drafts and rubric suggestions are examples, not extracted event requirements. Changes reset on reload.</div>
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="min-w-0 space-y-6">
        <form onSubmit={(e) => { e.preventDefault(); void extract(); }} className="glass space-y-4 p-5 sm:p-6">
          <StepHead n={1} title="Tell us about the event" hint="Name the event and paste the link to its rules page." done={!!event} />
          <div><label htmlFor="event-name" className="mb-2 block text-sm">Event name</label><input id="event-name" required disabled={busy} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Build Together 2026" className={input} /></div>
          <div><label htmlFor="event-url" className="mb-2 block text-sm">Event / rules link</label><input id="event-url" type="url" required disabled={busy} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/rules" className={`${input} font-mono`} /></div>
          <div className="flex flex-wrap items-center gap-3"><Pill type="submit" disabled={busy}><Sparkles className="size-4" />{busy ? "Preparing rules…" : event ? "Prepare rules again" : "Prepare rule draft"}</Pill>{event && <Badge tone={event.confirmed ? "good" : "accent"}>{event.confirmed ? "Confirmed by judge" : "Draft, not final"}</Badge>}</div>
          {error && <p role="alert" className="text-sm text-fail">{error}</p>}
          {event && dirty && <p className="text-sm text-warn">Unsaved changes. Preparing again replaces the current rules.</p>}
        </form>
        <section aria-label="Eligibility rules" className="glass p-5 sm:p-6">
          <StepHead n={2} title="Review eligibility rules" hint="Tick the rules that apply, edit wording, then confirm." done={!!event?.confirmed} right={<span className="shrink-0 font-mono text-xs text-muted-foreground">{event?.rules.filter((r) => r.enabled).length ?? 0} active</span>} />
          {!event?.rules.length && <div className="mt-4 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Fill in step 1 to get a rule draft here.</div>}
          <ul className="mt-4 space-y-2">{event?.rules.map((r, i) => <li key={r.id} className={`flex items-center gap-3 rounded-2xl bg-well p-2 pl-4 ${r.enabled ? "" : "opacity-60"}`}>
            <input type="checkbox" aria-label={`Enable rule ${i + 1}`} checked={r.enabled} disabled={busy} onChange={(e) => updateEventRules(event.rules.map((x) => x.id === r.id ? { ...x, enabled: e.target.checked } : x))} className="size-4 shrink-0 accent-(--brand) focus-visible:outline-2 focus-visible:outline-ring" />
            <input aria-label={`Rule ${i + 1}`} disabled={busy} value={r.label} placeholder="Describe the rule" onChange={(e) => updateEventRules(event.rules.map((x) => x.id === r.id ? { ...x, label: e.target.value } : x))} className="h-10 min-w-0 flex-1 rounded-xl border border-transparent bg-transparent px-2 text-sm focus:border-border focus-visible:outline-2 focus-visible:outline-ring" />
            <Button type="button" variant="ghost" size="icon" disabled={busy} aria-label={`Remove rule ${i + 1}`} title="Remove rule" onClick={() => updateEventRules(event.rules.filter((x) => x.id !== r.id))}><Trash2 className="size-4" /></Button>
          </li>)}</ul>
          {event && <div className="mt-5 flex flex-wrap gap-3"><Pill variant="outline" disabled={busy} onClick={() => updateEventRules([...event.rules, { id: newEventRuleId(), label: "", enabled: true }])}><Plus className="size-4" />Add rule</Pill><Pill disabled={busy || dirty || event.confirmed || !event.rules.some((r) => r.enabled) || event.rules.some((r) => r.enabled && !r.label.trim())} onClick={() => confirmEventRules()}><Check className="size-4" />{event.confirmed ? "Rules confirmed" : "Confirm rules"}</Pill></div>}
        </section>
      </div>
      <aside className="glass min-w-0 space-y-5 p-5 sm:p-6 lg:sticky lg:top-24">
        <p className="eyebrow font-mono">Setup checklist</p>
        <ol className="space-y-3 text-sm">
          {([["Event details saved", !!event], ["Rules confirmed", !!event?.confirmed], ["Rubric adds up to 100%", weightTotal(criteria) === 100]] as const).map(([l, d]) => <li key={l} className="flex items-center gap-3"><span className={`grid size-6 shrink-0 place-items-center rounded-full border ${d ? "border-pass text-pass" : "border-border text-muted-foreground"}`}>{d ? <Check className="size-3.5" /> : null}</span><span className={d ? "" : "text-muted-foreground"}>{l}</span></li>)}
        </ol>
        {event && <section className="border-t border-border pt-5"><p className="eyebrow font-mono">Event source</p><h2 className="mt-2 break-words text-lg">{event.name}</h2><a href={event.url} target="_blank" rel="noreferrer" className="mt-2 flex items-start gap-2 break-all text-sm text-primary"><Link2 className="mt-0.5 size-4 shrink-0" />{event.url}</a></section>}
        {event?.rules.length ? <section className="border-t border-border pt-5"><p className="eyebrow font-mono">Suggested rubric · sample</p><dl className="mt-3 space-y-2">{suggestions.map((c) => <div key={c.id} className="flex justify-between gap-3 text-sm"><dt>{c.name}</dt><dd className="font-mono text-primary">{c.weight}%</dd></div>)}</dl><Pill variant="outline" className="mt-4" onClick={() => { if (window.confirm("Replace the current rubric with these sample criteria and weights?")) setApplied(saveRubric(suggestions)); }}>Apply sample rubric</Pill>{applied && <p role="status" className="mt-3 text-sm text-pass">Rubric updated.</p>}</section> : null}
        <p className="border-t border-border pt-4 text-xs text-muted-foreground">Rules are drafts for judge review. Only the judge makes the final decision.</p>
        {event?.confirmed ? <Button asChild className="w-full rounded-full"><Link to="/app">Continue to entries <ArrowRight /></Link></Button> : <a href="#rubric" className="block text-center text-sm text-primary">Next: set the rubric ↓</a>}
      </aside>
    </div>
    <section id="rubric" aria-label="Scoring rubric" className="mt-10 scroll-mt-24"><RubricEditor /></section>
  </>;
}
function StepHead({ n, title, hint, done, right }: { n: number; title: string; hint: string; done?: boolean; right?: ReactNode }) {
  return <div className="flex items-start gap-3">
    <span className={`grid size-8 shrink-0 place-items-center rounded-full font-mono text-sm ${done ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}>{done ? <Check className="size-4" /> : n}</span>
    <div className="min-w-0 flex-1"><h2 className="text-lg">{title}</h2><p className="mt-0.5 text-sm text-muted-foreground">{hint}</p></div>{right}
  </div>;
}
