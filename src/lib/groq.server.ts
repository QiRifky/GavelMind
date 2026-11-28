/** Groq is the only AI provider. Server-only: needs GROQ_API_KEY; GROQ_MODEL optionally overrides the model. */
export type GroqConfig = { name: "Groq"; url: string; key: string; model: string };

export const GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile";

export function groqConfig(): GroqConfig {
  const key = process.env["GROQ_API_KEY"]?.trim();
  if (!key) throw new Error("No AI provider is configured. Add GROQ_API_KEY on the server.");
  return { name: "Groq", url: "https://api.groq.com/openai/v1/chat/completions", key, model: process.env["GROQ_MODEL"]?.trim() || GROQ_DEFAULT_MODEL };
}

/** JSON chat call; retries once after a short pause when Groq is rate-limited or busy. */
export async function chatJson(p: GroqConfig, system: string, user: string, maxTokens: number, timeoutMs: number): Promise<{ text: string | undefined; finish: string | undefined }> {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(p.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${p.key}` },
      body: JSON.stringify({ model: p.model, messages: [{ role: "system", content: system }, { role: "user", content: user }], response_format: { type: "json_object" }, temperature: 0.1, max_tokens: maxTokens }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!r.ok) {
      const body = (await r.text()).slice(0, 500);
      console.error("Groq API failed", { status: r.status, body });
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
