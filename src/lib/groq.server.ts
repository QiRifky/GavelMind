/** Free OpenAI-compatible chat providers for self-hosting (e.g. a Fly Sprite). Server-only. OpenRouter wins over Groq when both keys are set. */
export type FreeProvider = { name: string; url: string; key: string; model: string };

export function pickFreeProvider(): FreeProvider | undefined {
  const or = process.env["OPENROUTER_API_KEY"];
  if (or) return { name: "OpenRouter", url: "https://openrouter.ai/api/v1/chat/completions", key: or, model: process.env["OPENROUTER_MODEL"] || "meta-llama/llama-3.3-70b-instruct:free" };
  const groq = process.env["GROQ_API_KEY"];
  if (groq) return { name: "Groq", url: "https://api.groq.com/openai/v1/chat/completions", key: groq, model: "llama-3.3-70b-versatile" };
  return undefined;
}

export async function chatJson(p: FreeProvider, system: string, user: string, maxTokens: number, timeoutMs: number): Promise<{ text: string | undefined; finish: string | undefined }> {
  const r = await fetch(p.url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${p.key}`, "X-Title": "GavelMind" },
    body: JSON.stringify({ model: p.model, messages: [{ role: "system", content: system }, { role: "user", content: user }], response_format: { type: "json_object" }, temperature: 0.1, max_tokens: maxTokens }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!r.ok) {
    console.error(`${p.name} API failed`, { status: r.status, body: (await r.text()).slice(0, 500) });
    throw new Error(`${p.name} API request failed (${r.status}).`);
  }
  const d = await r.json() as { choices?: { finish_reason?: string; message?: { content?: string } }[] };
  const text = d.choices?.[0]?.message?.content?.replace(/^```(?:json)?\s*|\s*```$/g, "");
  return { text, finish: d.choices?.[0]?.finish_reason };
}
