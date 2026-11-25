import { describe, expect, it } from "vitest";
import { judgeTotal } from "../lib/api";
const crit = [{ id: "a", name: "A", weight: 75 }, { id: "b", name: "B", weight: 25 }];
describe("judgeTotal", () => {
  it("stays unranked until the judge decides every criterion", () => {
    expect(judgeTotal({ a: 8 }, crit)).toBeNull();
    expect(judgeTotal(undefined, crit)).toBeNull();
  });
  it("weights only the judge's final scores", () => {
    expect(judgeTotal({ a: 8, b: 4 }, crit)).toBe(7);
  });
});
