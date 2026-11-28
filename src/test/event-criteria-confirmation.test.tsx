import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { EventCriteria } from "@/components/event-criteria";
import { extractRulesFromUrl } from "@/lib/event-rules.functions";
import { createFolder, extractEventRules, saveEvent, snapshot } from "@/lib/api";

afterEach(cleanup);

it("confirms page-extracted judging criteria through the Event control", async () => {
  createFolder("Website judging criteria");
  saveEvent("Hacksgiving", "https://fly.io/hacksgiving/");
  const original = snapshot().criteria;
  render(<EventCriteria busy={false} />);
  vi.mocked(extractRulesFromUrl).mockResolvedValueOnce({ ok: true, summary: "An agent event", rules: [], criteria: [
    { name: "Agent reliability", quote: "Build reliable agents", weight: 60, weightSource: "suggested" },
    { name: "Real-world impact", quote: "Solve a real problem", weight: 40, weightSource: "suggested" },
  ] });
  await act(async () => { await extractEventRules(); });
  expect(snapshot().criteria).toEqual(original);
  fireEvent.click(screen.getByRole("button", { name: "Confirm criteria" }));
  expect(snapshot().criteria.map(({ name, weight }) => ({ name, weight }))).toEqual([
    { name: "Agent reliability", weight: 60 }, { name: "Real-world impact", weight: 40 },
  ]);
  expect(snapshot().event?.criteriaConfirmed).toBe(true);
});