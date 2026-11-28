import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Discovered } from "./api";

export const importShowcase = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ url: z.string().url().max(500) }).parse(data))
  .handler(async ({ data }): Promise<{ ok: true; items: Discovered[] } | { ok: false; message: string }> => {
    try {
      const { scanPublicShowcase } = await import("./showcase.server");
      return { ok: true, items: await scanPublicShowcase(data.url) };
    } catch (error) {
      const message = error instanceof Error && /^(Use a |The showcase|This URL|No direct)/.test(error.message) ? error.message : "Couldn't read this showcase. Upload an exported CSV, JSON or TXT file instead.";
      return { ok: false, message };
    }
  });