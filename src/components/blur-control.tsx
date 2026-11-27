import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const KEY = "gavelmind-card-blur-pct";
/** 0% = no blur, 50% = default, 100% = strong (2× default). */
export const blurScale = (pct: number) => Math.min(100, Math.max(0, pct)) / 50;

/** Display control: a volume-style slider for how strongly glass cards blur the background. */
export function BlurControl({ className }: { className?: string }) {
  const [pct, setPct] = useState(50);
  useEffect(() => {
    const saved = Number(window.localStorage.getItem(KEY));
    if (window.localStorage.getItem(KEY) !== null && Number.isFinite(saved)) setPct(Math.min(100, Math.max(0, saved)));
  }, []);
  useEffect(() => {
    document.documentElement.style.setProperty("--blur-scale", String(blurScale(pct)));
    window.localStorage.setItem(KEY, String(pct));
  }, [pct]);
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
        <label htmlFor="card-blur">Card blur</label>
        <span className="tabular-nums text-foreground">{pct}%</span>
      </div>
      <input id="card-blur" type="range" min={0} max={100} step={1} value={pct}
        onChange={(e) => setPct(Number(e.target.value))}
        aria-valuetext={`${pct}%`}
        className="w-full max-w-64 cursor-pointer accent-primary" />
      <div className="flex max-w-64 justify-between text-[11px] text-muted-foreground"><span>Clear</span><span>Strong</span></div>
    </div>
  );
}
