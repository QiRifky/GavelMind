export interface ExtractedCriterion {
  name: string;
  quote: string;
  weight: number;
  weightSource: "event" | "suggested";
}

const norm = (text: string) => text.toLowerCase().replace(/\s+/g, " ").trim();

/** Accept only page-backed criteria; missing or invalid official weights become an explicit equal-weight suggestion. */
export function parseEventCriteria(value: unknown, page: string): ExtractedCriterion[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const criteria = value.flatMap((item: unknown) => {
    if (!item || typeof item !== "object") return [];
    const data = item as Record<string, unknown>;
    const name = typeof data["name"] === "string" ? data["name"].trim().slice(0, 120) : "";
    const quote = typeof data["quote"] === "string" ? data["quote"].trim() : "";
    if (!name || !quote || quote.length > 600 || !norm(page).includes(norm(quote)) || seen.has(norm(name))) return [];
    seen.add(norm(name));
    const weight = typeof data["weight"] === "number" && Number.isFinite(data["weight"]) ? data["weight"] : 0;
    const official = data["weightSource"] === "event" && weight > 0 && weight <= 100 && quote.includes(`${weight}%`);
    return [{ name, quote, weight: official ? weight : 0, weightSource: official ? "event" as const : "suggested" as const }];
  }).slice(0, 12);
  const official = criteria.length > 0 && criteria.every((c) => c.weightSource === "event") && criteria.reduce((sum, c) => sum + c.weight, 0) === 100;
  return official ? criteria : criteria.map((c, i) => ({ ...c, weight: Math.floor(100 / criteria.length) + (i < 100 % criteria.length ? 1 : 0), weightSource: "suggested" }));
}