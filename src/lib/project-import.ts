import Papa from "papaparse";
import type { Discovered } from "./api";

export function repositoryUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:" || !/^(www\.)?github\.com$/i.test(url.hostname) || url.username || url.password) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    const owner = parts[0]; const repo = parts[1]?.replace(/\.git$/i, "");
    if (!owner || !repo || parts.length !== 2 || !/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) return null;
    if (["topics", "orgs", "settings", "collections", "features", "marketplace", "sponsors"].includes(owner.toLowerCase())) return null;
    return `https://github.com/${owner}/${repo}`;
  } catch { return null; }
}

export function uniqueProjects(items: Discovered[]): Discovered[] {
  const known = new Set<string>();
  return items.filter((item) => { const key = item.repoUrl.toLowerCase(); if (known.has(key)) return false; known.add(key); return true; });
}

const keyOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
function projectFromRow(row: unknown): Discovered | null {
  if (typeof row === "string") { const repoUrl = repositoryUrl(row); return repoUrl ? { name: repoUrl.replace("https://github.com/", ""), repoUrl } : null; }
  if (!row || typeof row !== "object" || Array.isArray(row)) return null;
  const fields = Object.entries(row).map(([k, v]) => [keyOf(k), v] as const);
  const value = (names: string[]) => fields.find(([k]) => names.includes(k))?.[1];
  const repoUrl = repositoryUrl(value(["repourl", "repositoryurl", "repository", "github", "githuburl", "githublink", "repositorylink", "repo"])) ?? fields.map(([, v]) => repositoryUrl(v)).find(Boolean);
  if (!repoUrl) return null;
  const name = value(["name", "project", "projectname", "title", "namaprojek", "namaproyek"]);
  const demo = value(["demo", "demourl", "demolink", "website", "websiteurl"]);
  let demoUrl: string | undefined;
  if (typeof demo === "string") { try { const u = new URL(demo); if (["http:", "https:"].includes(u.protocol) && !u.username && !u.password) demoUrl = u.href; } catch { /* optional demo */ } }
  return { repoUrl, name: typeof name === "string" && name.trim() ? name.trim().slice(0, 160) : repoUrl.replace("https://github.com/", ""), ...(demoUrl ? { demoUrl } : {}) };
}

export function parseImportFile(filename: string, text: string): { items: Discovered[]; skipped: number } {
  const extension = filename.split(".").pop()?.toLowerCase();
  let rows: unknown[];
  if (extension === "json") {
    let data: unknown;
    try { data = JSON.parse(text); } catch { throw new Error("Invalid JSON file."); }
    if (Array.isArray(data)) rows = data;
    else if (data && typeof data === "object" && "projects" in data && Array.isArray(data.projects)) rows = data.projects;
    else throw new Error("JSON must contain a project array or a projects array.");
  } else if (extension === "csv") {
    const parsed = Papa.parse<Record<string, unknown>>(text.replace(/^\uFEFF/, ""), { header: true, skipEmptyLines: "greedy" });
    if (parsed.errors.length) throw new Error("The CSV has invalid or inconsistent columns.");
    rows = parsed.data;
  } else if (extension === "txt") {
    rows = text.match(/https:\/\/(?:www\.)?github\.com\/[^\s,;<>"']+/gi)?.map((u) => u.replace(/[.)]+$/, "")) ?? [];
  } else throw new Error("Choose a CSV, JSON or TXT file.");
  const valid = rows.map(projectFromRow).filter((p): p is Discovered => Boolean(p));
  const items = uniqueProjects(valid);
  if (!items.length) throw new Error("No valid GitHub repository URLs were found in this file.");
  return { items, skipped: rows.length - items.length };
}