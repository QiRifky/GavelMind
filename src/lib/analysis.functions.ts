import { createServerFn } from "@tanstack/react-start";
import { analysisInput, type AnalysisResult } from "./analysis";
import { GatewayError } from "@lovable.dev/ai-gateway";

export const analyzeRepository = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => analysisInput.parse(data))
  .handler(async ({ data }): Promise<AnalysisResult> => {
    const gateway = process.env["GH_GATEWAY"];
    if (!gateway) return { ok: false, message: "Real GitHub analysis is not configured. Set GH_GATEWAY on the server. No sample report will be generated." };
    try {
      const { readRepository, analyzeWithGemini } = await import("./analysis.server");
      const repo = await readRepository(data.project.repoUrl, gateway);
      return { ok: true, report: await analyzeWithGemini(data, repo) };
    } catch (error) {
      if (error instanceof GatewayError) {
        console.error("AI analysis failed", { code: error.code, status: error.httpStatus, ids: error.ids });
        return { ok: false, message: error.httpStatus === 402 ? "AI credits are unavailable. Check workspace billing; no substitute scores were generated." : "Gemini analysis could not complete. Check AI access and request logs before retrying; no report was saved." };
      }
      // Only app-authored explanations cross the boundary; network errors may contain secret URLs.
      const allowedMessages = /^(Use a public|Invalid repository URL\.|The GitHub connector URL is invalid\.|Configure a real HTTPS|GitHub connector denied access\.|Repository not found\.|GitHub connector request failed \(\d+\)\.|No GitHub response\.|Only verified public repositories|No readable source material|Gemini did not return|Gemini returned unsupported evidence\.|Gemini did not complete|Gemini returned no analysis\.)/;
      const message = error instanceof Error && allowedMessages.test(error.message) ? error.message : "The analysis could not complete or returned invalid data. No report was saved. Check the service configuration before retrying.";
      return { ok: false, message };
    }
  });