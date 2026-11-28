import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import type { AnalysisInput } from "@/lib/analysis";

// Only tests substitute external services; production never uses a fixture fallback.
vi.mock("@/lib/analysis.functions", () => ({
  analyzeRepository: vi.fn(async ({ data }: { data: AnalysisInput }) => {
    const { fixtureReport } = await import("./analysis-fixture");
    return { ok: true, report: fixtureReport(data) };
  }),
}));

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
