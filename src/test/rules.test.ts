import { describe, expect, it } from "vitest";
import { agreement, canSaveRubric, EXPORT_LINE, exportResults, snapshot } from "../lib/api";

describe("rubric save", () => {
  it("allows save only when weights total exactly 100%", () => {
    expect(canSaveRubric([{ id: "a", name: "A", weight: 60 }, { id: "b", name: "B", weight: 40 }])).toBe(true);
    expect(canSaveRubric([{ id: "a", name: "A", weight: 60 }, { id: "b", name: "B", weight: 30 }])).toBe(false);
  });
});
describe("model agreement", () => {
  it("agrees only when all drafts are within 1 point", () => {
    expect(agreement([6, 7, 7])).toBe(true);
    expect(agreement([5, 7, 6])).toBe(false);
  });
});
describe("export", () => {
  it("every format includes the judge-decision line and unreviewed projects are not scored", () => {
    for (const f of ["csv", "json", "md"] as const) expect(exportResults(f, snapshot()).content).toContain(EXPORT_LINE);
    expect(exportResults("md", snapshot()).content).toContain("Awaiting judge review");
  });
});
