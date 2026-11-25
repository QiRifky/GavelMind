import type { Report } from "./api";

/**
 * Mock judge copilot. Answers only from collected report material.
 * It never gives scores, ranks or a winner: those are the judge's decisions.
 */
export function copilotAnswer(question: string, report: Report | null): string {
  const q = question.toLowerCase();
  if (/(winner|win|menang|juara|rank|peringkat|best|terbaik|score|skor|nilai)/.test(q))
    return "I can't pick a winner or give a score. Ranking uses only your final scores. I can point you to evidence instead.";
  if (!report) return "The report is still loading. Ask again in a moment.";
  if (/(stack|tech|framework|language|bahasa|teknologi)/.test(q))
    return `Detected stack: ${report.stack.map((s) => s.name).join(", ") || "nothing detected"}.`;
  if (/(test|check|rule|aturan|cek)/.test(q)) {
    const fails = report.checks.filter((c) => c.result !== "pass");
    return fails.length ? `${fails.length} check(s) need attention: ${fails.map((c) => c.label).join(", ")}.` : "All rule checks passed.";
  }
  if (/(flag|suspicious|curiga|risk|risiko)/.test(q))
    return report.flags.length ? `Top flag: ${report.flags[0]!.text} Evidence: ${report.flags[0]!.evidence}` : "No suspicious points were flagged.";
  if (/(run|jalan|sandbox|error|work)/.test(q)) return `Run status: ${report.run.status}. ${report.run.evidence}`;
  return report.summary.slice(0, 2).join(" ") || "No collected material answers that yet.";
}
