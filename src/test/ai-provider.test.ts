import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { aiCandidates } from "@/lib/groq.server";

const KEYS = ["LOVABLE_API_KEY", "OPENROUTER_API_KEY", "OPENROUTER_MODEL", "GROQ_API_KEY", "GEMINI_API_KEY"] as const;
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

describe("AI provider order", () => {
  it("tries Lovable's built-in model first when its key is present", () => {
    process.env["LOVABLE_API_KEY"] = "built-in";
    process.env["OPENROUTER_API_KEY"] = "free";
    process.env["GEMINI_API_KEY"] = "own";
    expect(aiCandidates()).toEqual([{ kind: "builtin" }, { kind: "free", provider: { name: "OpenRouter", url: "https://openrouter.ai/api/v1/chat/completions", key: "free", model: "meta-llama/llama-3.3-70b-instruct:free" } }, { kind: "gemini", key: "own" }]);
  });

  it("falls back to the host's own Gemini key when the free provider is the only other option", () => {
    process.env["OPENROUTER_API_KEY"] = "free";
    process.env["GEMINI_API_KEY"] = "own";
    const choices = aiCandidates();
    expect(choices.map((choice) => choice.kind)).toEqual(["free", "gemini"]);
  });

  it("keeps only the Gemini key when no free provider is configured", () => {
    process.env["GEMINI_API_KEY"] = "own";
    expect(aiCandidates()).toEqual([{ kind: "gemini", key: "own" }]);
  });

  it("still reports a clear configuration error when no key is set", () => {
    expect(aiCandidates()).toEqual([{ kind: "builtin" }]);
  });
});
