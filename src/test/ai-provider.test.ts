import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chatJson, groqConfig } from "@/lib/groq.server";

const KEYS = ["GROQ_API_KEY", "GROQ_MODEL", "GEMINI_API_KEY", "OPENROUTER_API_KEY", "LOVABLE_API_KEY"] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of KEYS) { saved[key] = process.env[key]; delete process.env[key]; }
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  for (const key of KEYS) {
    const value = saved[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("Groq is the only AI provider", () => {
  it("uses Groq with the default model when GROQ_API_KEY is set", () => {
    process.env["GROQ_API_KEY"] = "gsk_test";
    expect(groqConfig()).toEqual({ name: "Groq", url: "https://api.groq.com/openai/v1/chat/completions", key: "gsk_test", model: "llama-3.3-70b-versatile" });
  });

  it("ignores Gemini, OpenRouter and built-in keys", () => {
    process.env["GEMINI_API_KEY"] = "g";
    process.env["OPENROUTER_API_KEY"] = "o";
    process.env["LOVABLE_API_KEY"] = "l";
    expect(() => groqConfig()).toThrow("Add GROQ_API_KEY");
  });

  it("allows overriding the Groq model", () => {
    process.env["GROQ_API_KEY"] = "gsk_test";
    process.env["GROQ_MODEL"] = "llama-3.1-8b-instant";
    expect(groqConfig().model).toBe("llama-3.1-8b-instant");
  });

  it("parses comma-separated backup keys, removes empty and duplicate values", () => {
    process.env["GROQ_API_KEY"] = " gsk_first, ,gsk_second,gsk_first\ngsk_third ";
    expect(groqConfig().keys).toEqual(["gsk_first", "gsk_second", "gsk_third"]);
    expect(groqConfig().key).toBe("gsk_first");
  });

  it.each([401, 429])("switches to the second key after HTTP %s", async (status) => {
    process.env["GROQ_API_KEY"] = "gsk_first,gsk_second";
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response("rejected", { status })).mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: '{"ok":true}' }, finish_reason: "stop" }] })));
    vi.stubGlobal("fetch", fetchMock);
    expect(await chatJson(groqConfig(), "system", "user", 100, 1000)).toEqual({ text: '{"ok":true}', finish: "stop" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[1].headers.Authorization).toBe("Bearer gsk_first");
    expect(fetchMock.mock.calls[1]?.[1].headers.Authorization).toBe("Bearer gsk_second");
  });

  it("stops after all keys reach their limit without looping", async () => {
    process.env["GROQ_API_KEY"] = "gsk_first,gsk_second";
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response("limited", { status: 429 })));
    vi.stubGlobal("fetch", fetchMock);
    await expect(chatJson(groqConfig(), "system", "user", 100, 1000)).rejects.toThrow("same organization share limits");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not change keys for oversized requests", async () => {
    process.env["GROQ_API_KEY"] = "gsk_first,gsk_second";
    const fetchMock = vi.fn().mockResolvedValue(new Response("large", { status: 413 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(chatJson(groqConfig(), "system", "user", 100, 1000)).rejects.toThrow("413");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("preserves a single-key rate-limit retry", async () => {
    vi.useFakeTimers();
    process.env["GROQ_API_KEY"] = "gsk_single";
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response("limited", { status: 429 })).mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: "{}" } }] })));
    vi.stubGlobal("fetch", fetchMock);
    const request = chatJson(groqConfig(), "system", "user", 100, 1000);
    await vi.runAllTimersAsync();
    expect((await request).text).toBe("{}");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
