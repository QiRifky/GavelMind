import { describe, expect, it, vi } from "vitest";
import { extractRulesFromUrl } from "@/lib/event-rules.functions";
import { extractEventRules, saveEvent, snapshot } from "../lib/api";

describe("automatic event rules", () => {
  it("loads rules from the event page as unconfirmed drafts", async () => {
    vi.mocked(extractRulesFromUrl).mockResolvedValueOnce({ ok: true, rules: [{ label: "Run on a Fly Sprite", quote: "must run on a Sprite" }] });
    saveEvent("Hacks", "https://example.com/rules");
    await extractEventRules();
    expect(snapshot().event).toMatchObject({ confirmed: false, rules: [{ label: "Run on a Fly Sprite", enabled: true }] });
  });
});
