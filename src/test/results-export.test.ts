import { describe, expect, it } from "vitest";
import { resultsCsv, resultsSummary } from "@/lib/results";

const criteria = [{ id: "a", name: "Creativity", weight: 50 }, { id: "b", name: "Demo", weight: 50 }] as never;
const rows = [
  { name: "low", total: 6, finals: { a: 6, b: 6 } },
  { name: "wait", total: null, finals: { a: 9 } },
  { name: "high", total: 8.5, finals: { a: 9, b: 8 } },
];

describe("results export", () => {
  it("ranks only judge-scored rows, highest first", () => {
    const lines = resultsCsv(rows, criteria).split("\n");
    expect(lines[1]).toBe("1,high,9,8,8.50,Judge scored");
    expect(lines[2]).toBe("2,low,6,6,6.00,Judge scored");
    expect(lines[3]).toBe(",wait,9,,,Awaiting judge review");
  });
  it("summary never ranks unreviewed projects", () => {
    expect(resultsSummary("Hack", rows)).toBe("Hack — judge final scores\n1. high — 8.50/10\n2. low — 6.00/10\n1 awaiting judge review");
  });
});
