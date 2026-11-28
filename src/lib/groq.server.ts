/** Groq is the only AI provider. Server-only: needs GROQ_API_KEY; GROQ_MODEL optionally overrides the model. */
export type GroqConfig = { name: "Groq"; url: string; key: string; keys?: string[]; model: string };

export const GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile";

export function groqConfig(): GroqConfig {
  const keys = [...new Set((process.env["GROQ_API_KEY"] || "").split(/[,\r\n]+/).map((key) => key.trim()).filter(Boolean))];
  const key = keys[0];
  if (!key) throw new Error("No AI provider is configured. Add GROQ_API_KEY on the server.");
  return { name: "Groq", url: "https://api.groq.com/openai/v1/chat/completions", key, ...(keys.length > 1 ? { keys } : {}), model: process.env["GROQ_MODEL"]?.trim() || GROQ_DEFAULT_MODEL };
}

/** Try configured backup keys on 401/429; same-organization keys still share Groq limits. */
export async function chatJson(p: GroqConfig, system: string, user: string, maxTokens: number, timeoutMs: number): Promise<{ text: string | undefined; finish: string | undefined }> {
  const keys = p.keys?.length ? p.keys : [p.key];
  let keyIndex = 0;
  for (let attempt = 0; ; attempt++) {
    const key = keys[keyIndex];
    if (!key) throw new Error("No Groq API key is available.");
    const r = await fetch(p.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: p.model, messages: [{ role: "system", content: system }, { role: "user", content: user }], response_format: { type: "json_object" }, temperature: 0.1, max_tokens: maxTokens }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!r.ok) {
      // Provider responses may echo credentials; never log their bodies or keys.
      await r.body?.cancel();
      console.error("Groq API failed", { status: r.status });
      if ((r.status === 401 || r.status === 429) && keyIndex + 1 < keys.length) { keyIndex++; attempt = -1; continue; }
      if (r.status === 429 && keys.length > 1) throw new Error("Groq rate limit reached (429) for all configured keys. Keys in the same organization share limits; wait and retry.");
      if (attempt === 0 && (r.status === 429 || r.status >= 500)) { await new Promise((resolve) => setTimeout(resolve, 3000)); continue; }
      if (r.status === 401) throw new Error("Groq rejected the API key (401). Check GROQ_API_KEY.");
      if (r.status === 413) throw new Error("Groq request too large (413). Try a smaller repository or page.");
      if (r.status === 429) throw new Error("Groq rate limit reached (429). Wait a minute and retry.");
      throw new Error(`Groq API request failed (${r.status}).`);
    }
    const d = await r.json() as { choices?: { finish_reason?: string; message?: { content?: string } }[] };
    const text = d.choices?.[0]?.message?.content?.replace(/^```(?:json)?\s*|\s*```$/g, "");
    return { text, finish: d.choices?.[0]?.finish_reason };
  }
}
