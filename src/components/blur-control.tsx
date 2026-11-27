import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const LEVELS = [
  { id: "soft", label: "Soft" },
  { id: "medium", label: "Medium" },
  { id: "strong", label: "Strong" },
] as const;
type Level = (typeof LEVELS)[number]["id"];
const KEY = "gavelmind-card-blur";

/** Display control: sets how strongly glass cards blur the background. */
export function BlurControl({ className }: { className?: string }) {
  const [level, setLevel] = useState<Level>("medium");
  useEffect(() => {
    const saved = window.localStorage.getItem(KEY);
    if (saved === "soft" || saved === "medium" || saved === "strong") setLevel(saved);
  }, []);
  useEffect(() => {
    document.documentElement.dataset["blur"] = level;
    window.localStorage.setItem(KEY, level);
  }, [level]);
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="text-xs font-medium text-muted-foreground">Card blur</span>
      <div role="radiogroup" aria-label="Card blur" className="grid w-fit grid-cols-3 gap-1 rounded-full border border-glass-rim bg-glass-inner p-1">
        {LEVELS.map((l) => (
          <button key={l.id} type="button" role="radio" aria-checked={level === l.id} onClick={() => setLevel(l.id)}
            className={cn("rounded-full px-3 py-1.5 text-xs font-medium transition-colors", level === l.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}
