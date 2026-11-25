import { describe, expect, it } from "vitest";
import { aggregate, weightsValid } from "@/lib/api";
import { EXPORT_NOTE, toCsv, toJson, toMarkdown } from "@/lib/export";

const c = (w: number[]) => w.map((weight, i) => ({ id: `c${i}`, name: `C${i}`, weight }));

describe("rubric weights", () => {
  it("can be saved only when weights total exactly 100", () => {
    expect(weightsValid(c([25, 25, 25, 25]))).toBe(true);
    expect(weightsValid(c([25, 25, 25, 20]))).toBe(false);
    expect(weightsValid(c([60, 50]))).toBe(false);
  });
});

describe("multi-model aggregate", () => {
  it("averages model drafts and counts models within 1 point", () => {
    expect(aggregate([6, 7, 8])).toEqual({ avg: 7, agree: 3 });
    expect(aggregate([6, 7, 9])).toEqual({ avg: 7.3, agree: 1 });
    expect(aggregate([])).toEqual({ avg: null, agree: 0 });
  });
});

describe("export", () => {
  const data = {
    entries: [{ id: "a", url: "u", name: "team/a", status: "done" as const, repoUrl: "u" }, { id: "b", url: "v", name: "team/b", status: "done" as const, repoUrl: "v" }],
    criteria: c([50, 50]),
    finals: { a: { c0: 8, c1: 6 } },
    log: [],
    finalized: false,
  };
  it("includes the draft note in every format and never ranks unreviewed projects", () => {
    for (const out of [toCsv(data), toJson(data), toMarkdown(data)]) expect(out).toContain(EXPORT_NOTE);
    const json = JSON.parse(toJson(data)) as { results: { project: string; rank: string; judgeTotal: number | null }[] };
    expect(json.results).toEqual([
      expect.objectContaining({ project: "team/a", rank: "1", judgeTotal: 7 }),
      expect.objectContaining({ project: "team/b", rank: "Awaiting judge review", judgeTotal: null }),
    ]);
  });
});
