import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type RulesResult = { ok: true; summary: string; rules: { label: string; quote: string }[] } | { ok: false; message: string };

export const extractRulesFromUrl = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ url: z.string().url().max(500) }).parse(d))
  .handler(async ({ data }): Promise<RulesResult> => {
    try {
      const { readEventPage, extractRulesWithAi } = await import("./event-rules.server");
      const page = await readEventPage(data.url);
      const { summary, rules } = await extractRulesWithAi(page);
      if (!rules.length) return { ok: false, message: "No rules with matching text were found on the event page. Enter them manually." };
      return { ok: true, summary, rules };
    } catch (error) {
      const msg = error instanceof Error && /^(Use a public|The event page|Groq |No AI provider)/.test(error.message) ? error.message : "Couldn't read rules from the event page. Enter them manually.";
      console.error("Rule extraction failed", error instanceof Error ? error.message : error);
      return { ok: false, message: msg };
    }
  });
