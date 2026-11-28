import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { GatewayError } from "@lovable.dev/ai-gateway";

export type RulesResult = { ok: true; rules: { label: string; quote: string }[] } | { ok: false; message: string };

export const extractRulesFromUrl = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ url: z.string().url().max(500) }).parse(d))
  .handler(async ({ data }): Promise<RulesResult> => {
    try {
      const { readEventPage, extractRulesWithGemini } = await import("./event-rules.server");
      const page = await readEventPage(data.url);
      const rules = await extractRulesWithGemini(page);
      if (!rules.length) return { ok: false, message: "No rules with matching text were found on the event page. Enter them manually." };
      return { ok: true, rules };
    } catch (error) {
      if (error instanceof GatewayError) {
        console.error("Rule extraction AI failed", { code: error.code, status: error.httpStatus });
        return { ok: false, message: error.httpStatus === 402 ? "AI credits are unavailable. Enter the rules manually." : "Gemini could not read the rules. Try again or enter them manually." };
      }
      const msg = error instanceof Error && /^(Use a public|The event page|Gemini )/.test(error.message) ? error.message : "Couldn't read rules from the event page. Enter them manually.";
      console.error("Rule extraction failed", error instanceof Error ? error.message : error);
      return { ok: false, message: msg };
    }
  });
