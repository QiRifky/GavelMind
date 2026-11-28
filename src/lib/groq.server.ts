/** Groq (OpenAI-compatible) chat call for self-hosting, e.g. on a Fly Sprite. Server-only. */
export const GROQ_MODEL = "llama-3.3-70b-versatile";

export async function groqJson(apiKey: string, system: string, user: string, maxTokens: number, timeoutMs: number): Promise<{ text: string | undefined; finish: string | undefined }> {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: GROQ_MODEL, messages: [{ role: "system", content: system }, { role: "user", content: user }], response_format: { type: "json_object" }, temperature: 0.1, max_tokens: maxTokens }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!r.ok) {
    console.error("Groq API failed", { status: r.status, body: (await r.text()).slice(0, 500) });
    throw new Error(`Groq API request failed (${r.status}).`);
  }
  const d = await r.json() as { choices?: { finish_reason?: string; message?: { content?: string } }[] };
  return { text: d.choices?.[0]?.message?.content, finish: d.choices?.[0]?.finish_reason };
}
