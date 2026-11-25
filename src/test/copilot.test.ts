import { describe, expect, it } from "vitest";
import { copilotAnswer } from "@/lib/copilot";

describe("copilot", () => {
  it("refuses to name a winner or give a score", () => {
    expect(copilotAnswer("Who is the winner?", null)).toMatch(/can't pick a winner/);
    expect(copilotAnswer("Berapa skor proyek ini?", null)).toMatch(/can't pick a winner/);
  });
});
