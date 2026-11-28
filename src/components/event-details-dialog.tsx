import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FolderPlus, Pencil, Sparkles } from "lucide-react";
import { createFolder, extractEventRules, saveEvent, useApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function EventDetailsDialog({ edit = false, trigger }: { edit?: boolean; trigger?: ReactNode }) {
  const { event } = useApi();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [prepare, setPrepare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = "h-11 w-full min-w-0 rounded-lg border border-border bg-well px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring";
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    let parsed: URL;
    try { parsed = new URL(url.trim()); } catch { setError("Enter a valid event URL."); return; }
    if (!name.trim() || !["https:", "http:"].includes(parsed.protocol)) {
      setError("Enter an event name and a valid web URL."); return;
    }
    setBusy(true);
    try {
      if (!edit) createFolder(name);
      if (!edit || name.trim() !== event?.name || url.trim() !== event?.url) saveEvent(name, url);
      if (!edit && prepare) await extractEventRules();
      setOpen(false);
      await navigate({ to: "/app/event" });
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't save event details."); }
    finally { setBusy(false); }
  };
  return <Dialog open={open} onOpenChange={(next) => {
    if (busy) return;
    setOpen(next);
    if (next) { setName(edit ? event?.name ?? "" : ""); setUrl(edit ? event?.url ?? "" : ""); setPrepare(false); setError(""); }
  }}>
    <DialogTrigger asChild>{trigger ?? <Button variant="ghost" size="sm" className="shrink-0 rounded-full text-muted-foreground">
      {edit ? <Pencil className="size-4" /> : <FolderPlus className="size-4" />}{edit ? "Edit event details" : "New event folder"}
    </Button>}</DialogTrigger>
    <DialogContent className="glass-panel max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-card sm:rounded-card">
      <DialogHeader><div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-accent text-primary"><FolderPlus className="size-5" /></div><DialogTitle>{edit ? "Edit event details" : "New event folder"}</DialogTitle><DialogDescription>{edit ? "Event details" : "Event details · New workspace"}</DialogDescription></DialogHeader>
      <form onSubmit={(e) => void submit(e)} className="space-y-5">
        <div><label htmlFor="folder-event-name" className="mb-2 block text-sm">Event name</label><input id="folder-event-name" required disabled={busy} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Build Together 2026" className={input} /></div>
        <div><label htmlFor="folder-event-url" className="mb-2 block text-sm">Event / rules URL</label><input id="folder-event-url" type="url" required disabled={busy} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className={`${input} font-mono`} /></div>
        {!edit && <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={prepare} disabled={busy} onChange={(e) => setPrepare(e.target.checked)} className="size-4 accent-(--brand)" /><Sparkles className="size-4 shrink-0 text-primary" />Read rules from the event page automatically</label>}
        {edit && (name.trim() !== event?.name || url.trim() !== event?.url) && event?.rules.length ? <p className="text-sm text-warn">Changing event details clears the current rules and requires judge confirmation again.</p> : null}
        <p role="note" className="border-l-2 border-primary bg-accent p-3 text-xs leading-relaxed text-accent-foreground">Rules read from the event page are drafts; review and confirm them. Changes reset on reload.</p>
        {error && <p role="alert" className="text-sm text-fail">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4"><Button type="button" variant="outline" disabled={busy} className="rounded-full" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={busy || !name.trim() || !url.trim()} className="rounded-full">{busy ? "Preparing…" : edit ? "Save details" : prepare ? "Create & read rules" : "Create event folder"}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}