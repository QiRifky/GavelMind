import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ExtractedCriterion } from "./event-criteria";

export type RulesResult = { ok: true; summary: string; rules: { label: string; quote: string }[]; criteria: ExtractedCriterion[] } | { ok: false; message: string };

export const extractRulesFromUrl = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ url: z.string().url().max(500) }).parse(d))
  .handler(async ({ data }): Promise<RulesResult> => {
    try {
      const { readEventPage, extractRulesWithAi } = await import("./event-rules.server");
      const page = await readEventPage(data.url);
      const { summary, rules, criteria } = await extractRulesWithAi(page);
      if (!rules.length && !criteria.length && !summary) return { ok: false, message: "No supported event information was found. Enter it manually." };
      return { ok: true, summary, rules, criteria };
    } catch (error) {
      const msg = error instanceof Error && /^(Use a public|The event page|Groq |No AI provider)/.test(error.message) ? error.message : "Couldn't read rules from the event page. Enter them manually.";
      console.error("Rule extraction failed", error instanceof Error ? error.message : error);
      return { ok: false, message: msg };
    }
  });
