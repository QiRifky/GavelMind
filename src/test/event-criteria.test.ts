import { describe, expect, it, vi } from "vitest";
import { parseEventCriteria } from "@/lib/event-criteria";
import { extractRulesFromUrl } from "@/lib/event-rules.functions";
import { confirmEventCriteria, createFolder, extractEventRules, saveEvent, snapshot, switchFolder } from "@/lib/api";

describe("event-page judging criteria", () => {
  it("rejects invented criteria without a matching website quote", () => {
    expect(parseEventCriteria([{ name: "Innovation", quote: "Originality matters", weight: 100 }], "Build an agent on a Sprite.")).toEqual([]);
  });
  it("preserves explicit official percentage weights", () => {
    expect(parseEventCriteria([
      { name: "Impact", quote: "Impact 60%", weight: 60, weightSource: "event" },
      { name: "Quality", quote: "Quality 40%", weight: 40, weightSource: "event" },
    ], "Judging: Impact 60%, Quality 40%.").map((c) => c.weight)).toEqual([60, 40]);
  });
  it("labels missing weights as suggestions totaling 100", () => {
    const result = parseEventCriteria(["Impact", "Quality", "Originality"].map((name) => ({ name, quote: name })), "Impact Quality Originality");
    expect(result.map((c) => c.weight)).toEqual([34, 33, 33]);
    expect(result.every((c) => c.weightSource === "suggested")).toBe(true);
  });
  it("requires judge confirmation before website criteria replace active criteria", async () => {
    createFolder("Draft criteria test");
    saveEvent("Hacks", "https://example.com/hacks");
    const previous = snapshot().criteria;
    vi.mocked(extractRulesFromUrl).mockResolvedValueOnce({ ok: true, summary: "Agent hackathon", rules: [], criteria: [{ name: "Agent quality", quote: "Build useful agents", weight: 100, weightSource: "suggested" }] });
    await extractEventRules();
    expect(snapshot().criteria).toEqual(previous);
    expect(snapshot().event?.criteriaConfirmed).toBe(false);
    expect(confirmEventCriteria([{ id: "agent", name: "Agent quality", weight: 100 }])).toBe(true);
    expect(snapshot().criteria).toEqual([{ id: "agent", name: "Agent quality", weight: 100 }]);
    expect(snapshot().event?.criteriaConfirmed).toBe(true);
  });
  it("does not apply an extraction to another event folder", async () => {
    const first = createFolder("First");
    saveEvent("Same event", "https://example.com/event");
    let resolve: ((value: Awaited<ReturnType<typeof extractRulesFromUrl>>) => void) | undefined;
    vi.mocked(extractRulesFromUrl).mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    const reading = extractEventRules();
    createFolder("Second");
    saveEvent("Same event", "https://example.com/event");
    resolve?.({ ok: true, summary: "First only", rules: [], criteria: [] });
    await reading;
    expect(snapshot().event?.summary).toBeUndefined();
    switchFolder(first);
    expect(snapshot().event?.summary).toBeUndefined();
  });
});