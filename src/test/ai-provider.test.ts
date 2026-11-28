import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { groqConfig } from "@/lib/groq.server";

const KEYS = ["GROQ_API_KEY", "GROQ_MODEL", "GEMINI_API_KEY", "OPENROUTER_API_KEY", "LOVABLE_API_KEY"] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of KEYS) { saved[key] = process.env[key]; delete process.env[key]; }
});
afterEach(() => {
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
});
