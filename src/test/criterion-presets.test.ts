import { describe, expect, it } from "vitest";
import { CRITERION_PRESETS, canSaveRubric } from "../lib/api";

describe("criterion presets", () => {
  const names = CRITERION_PRESETS.map((p) => p.name);
  it("offers every default criterion as a pickable choice", () => {
    for (const n of ["Creativity", "Usefulness", "Technical quality", "Demo clarity"]) expect(names).toContain(n);
  });
  it("keeps preset names unique", () => {
    expect(new Set(names).size).toBe(names.length);
  });
  it("blocks saving until a criterion name is chosen", () => {
    expect(canSaveRubric([{ id: "a", name: "", weight: 100 }])).toBe(false);
  });
});
