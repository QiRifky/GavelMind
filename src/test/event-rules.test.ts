import { describe, expect, it } from "vitest";
import { confirmEventRules, extractEventRules, reportForEvent, saveEvent, snapshot, updateEventRules } from "../lib/api";

describe("event requirements", () => {
  it("requires a name and web URL", () => {
    expect(() => saveEvent("", "https://example.com/rules")).toThrow();
    expect(() => saveEvent("Test event", "javascript:alert(1)")).toThrow();
  });
  it("applies only confirmed active rules and never treats unknown eligibility as failure", async () => {
    saveEvent("Test event", "https://example.com/rules");
    await extractEventRules();
    const report = snapshot().reports["p1"];
    const event = snapshot().event;
    if (!report || !event) throw new Error("Missing test data");
    expect(reportForEvent(report, event).checks.map((r) => r.id)).toEqual(["runs"]);
    updateEventRules([{ id: "event-custom", label: "Use the required SDK", enabled: true }, { id: "event-off", label: "Disabled", enabled: false }]);
    expect(confirmEventRules()).toBe(true);
    const checks = reportForEvent(report, snapshot().event).checks;
    expect(checks.find((r) => r.id === "event-custom")).toMatchObject({ label: "Use the required SDK", result: "warn", evidenceUrl: "https://example.com/rules" });
    expect(checks.some((r) => r.id === "event-off")).toBe(false);
  });
  it("editing a confirmed rule requires confirmation again without changing judge scores", () => {
    const before = snapshot().judge;
    updateEventRules([{ id: "event-custom", label: "Provide a demo", enabled: true }]);
    expect(snapshot().event?.confirmed).toBe(false);
    expect(snapshot().judge).toEqual(before);
    updateEventRules([{ id: "event-empty", label: "", enabled: true }]);
    expect(confirmEventRules()).toBe(false);
  });
});