import { afterEach, describe, expect, it, vi } from "vitest";
import { discoverRepositories, assertPublicUrl, readShowcase, scanPublicShowcase } from "@/lib/showcase.server";
import { chatJson, groqConfig } from "@/lib/groq.server";
import { scanShowcase, snapshot } from "@/lib/api";
import { importShowcase } from "@/lib/showcase.functions";
vi.mock("@/lib/groq.server", () => ({ chatJson: vi.fn(), groqConfig: vi.fn() }));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.clearAllMocks(); });
const dns = () => new Response(JSON.stringify({ Answer: [{ type: 1, data: "93.184.216.34" }] }));
describe("public showcase discovery", () => {
  it("keeps only real GitHub anchor links and deduplicates", () => {
    const found = discoverRepositories('<a href="https://github.com/team/work">Work</a><a href="https://github.com/team/work.git">Code</a><a href="https://github.com/topics/work">Topic</a><script><a href="https://github.com/fake/fake">Fake</a></script>', "https://event.example");
    expect(found).toEqual([{ name: "Work", repoUrl: "https://github.com/team/work" }]);
  });
  it("rejects private destinations", async () => {
    await expect(assertPublicUrl("http://127.0.0.1")).rejects.toThrow("public");
    await expect(assertPublicUrl("http://192.168.1.1")).rejects.toThrow("public");
    await expect(assertPublicUrl("http://localhost")).rejects.toThrow("public");
  });
  it("revalidates redirects before fetching their target", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(dns()).mockResolvedValueOnce(dns()).mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: "http://127.0.0.1/private" } }));
    vi.stubGlobal("fetch", fetcher);
    await expect(readShowcase("https://event.example")).rejects.toThrow("public");
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it("rejects invented AI repositories and names", async () => {
    vi.stubEnv("GROQ_API_KEY", "test-only-key");
    vi.mocked(groqConfig).mockReturnValue({ name: "Groq", url: "https://api.groq.com", key: "test-only-key", model: "test" });
    vi.mocked(chatJson).mockResolvedValue({ text: JSON.stringify({ projects: [{ repoUrl: "https://github.com/fake/fake", name: "Fake" }, { repoUrl: "https://github.com/team/work", name: "Invented" }] }), finish: "stop" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(dns()).mockResolvedValueOnce(dns()).mockResolvedValueOnce(new Response('<a href="https://github.com/team/work">Work</a>', { headers: { "content-type": "text/html" } })));
    expect(await scanPublicShowcase("https://event.example")).toEqual([{ name: "Work", repoUrl: "https://github.com/team/work" }]);
  });
  it("returns source links without AI credentials", async () => {
    vi.stubEnv("GROQ_API_KEY", "");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(dns()).mockResolvedValueOnce(dns()).mockResolvedValueOnce(new Response('<a href="https://github.com/team/work">Work</a>', { headers: { "content-type": "text/html" } })));
    expect((await scanPublicShowcase("https://event.example"))[0]?.repoUrl).toBe("https://github.com/team/work");
    expect(chatJson).not.toHaveBeenCalled();
  });
  it("discovery never silently adds entries to the queue", async () => {
    const before = snapshot().projects;
    vi.mocked(importShowcase).mockResolvedValueOnce({ ok: true, items: [{ name: "Work", repoUrl: "https://github.com/team/work" }] });
    expect(await scanShowcase("https://event.example")).toHaveLength(1);
    expect(snapshot().projects).toBe(before);
  });
});